// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

class FMCMainDisplay extends BaseAirliners {
    constructor() {
        super(...arguments);
        FMCMainDisplay.DEBUG_INSTANCE = this;
        this.flightPhaseUpdateThrottler = new UpdateThrottler(800);
        this.fmsUpdateThrottler = new UpdateThrottler(250);
        this._progBrgDistUpdateThrottler = new UpdateThrottler(2000);
        this._apCooldown = 500;
        this.lastFlightPlanVersion = 0;
        this._messageQueue = new A32NX_MessageQueue(this);

        /** Declaration of every variable used (NOT initialization) */
        this.maxCruiseFL = undefined;
        this.recMaxCruiseFL = undefined;
        this.routeIndex = undefined;
        this.coRoute = { routeNumber: undefined, routes: undefined };
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
        // +ve for tailwind, -ve for headwind
        this.averageWind = undefined;
        this.perfApprQNH = undefined;
        this.perfApprTemp = undefined;
        this.perfApprWindHeading = undefined;
        this.perfApprWindSpeed = undefined;
        this.unconfirmedV1Speed = undefined;
        this.unconfirmedVRSpeed = undefined;
        this.unconfirmedV2Speed = undefined;
        this._toFlexChecked = undefined;
        this.toRunway = undefined;
        this.vApp = undefined;
        this.perfApprMDA = null;
        this.perfApprDH = null;
        this.perfApprFlaps3 = undefined;
        this._debug = undefined;
        this._checkFlightPlan = undefined;
        this._fuelPlanningPhases = undefined;
        this._zeroFuelWeightZFWCGEntered = undefined;
        this._taxiEntered = undefined;
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
        this._isBelowMinDestFob = undefined;
        this._defaultRouteFinalTime = undefined;
        this._fuelPredDone = undefined;
        this._fuelPlanningPhase = undefined;
        this._blockFuelEntered = undefined;
        this._initMessageSettable = undefined;
        this._checkWeightSettable = undefined;
        this._gwInitDisplayed = undefined;
        /* CPDLC Fields */
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
        this.fcuSelAlt = undefined;
        this._forceNextAltitudeUpdate = undefined;
        this._lastUpdateAPTime = undefined;
        this.updateAutopilotCooldown = undefined;
        this._lastHasReachFlex = undefined;
        this._apMasterStatus = undefined;
        this._lastRequestedFLCModeWaypointIndex = undefined;

        this._progBrgDist = undefined;
        this.preSelectedClbSpeed = undefined;
        this.preSelectedCrzSpeed = undefined;
        this.managedSpeedTarget = undefined;
        this.managedSpeedTargetIsMach = undefined;
        this.climbSpeedLimit = undefined;
        this.climbSpeedLimitAlt = undefined;
        this.climbSpeedLimitPilot = undefined;
        this.descentSpeedLimit = undefined;
        this.descentSpeedLimitAlt = undefined;
        this.descentSpeedLimitPilot = undefined;
        this.managedSpeedClimb = undefined;
        this.managedSpeedClimbIsPilotEntered = undefined;
        this.managedSpeedClimbMach = undefined;
        // this.managedSpeedClimbMachIsPilotEntered = undefined;
        this.managedSpeedCruise = undefined;
        this.managedSpeedCruiseIsPilotEntered = undefined;
        this.managedSpeedCruiseMach = undefined;
        // this.managedSpeedCruiseMachIsPilotEntered = undefined;
        this.managedSpeedDescend = undefined;
        this.managedSpeedDescendPilot = undefined;
        this.managedSpeedDescendMach = undefined;
        this.managedSpeedDescendMachPilot = undefined;
        // this.managedSpeedDescendMachIsPilotEntered = undefined;
        this.cruiseFlightLevelTimeOut = undefined;
        /** @type {0 | 1 | 2 | 3 | null} Takeoff config entered on PERF TO */
        this.flaps = undefined;
        this.ths = undefined;
        this.cruiseTemperature = undefined;
        this.taxiFuelWeight = undefined;
        this.blockFuel = undefined;
        this.zeroFuelWeight = undefined;
        this.zeroFuelWeightMassCenter = undefined;
        this.activeWpIdx = undefined;
        this.efisSymbols = undefined;
        this.groundTempAuto = undefined;
        this.groundTempPilot = undefined;
        /**
         * Landing elevation in feet MSL.
         * This is the destination runway threshold elevation, or airport elevation if runway is not selected.
         */
        this.landingElevation = undefined;
        /*
         * Latitude part of the touch down coordinate.
         * This is the destination runway coordinate, or airport coordinate if runway is not selected
         */
        this.destinationLatitude = undefined;
        /*
         * Latitude part of the touch down coordinate.
         * This is the destination runway coordinate, or airport coordinate if runway is not selected
         */
        this.destinationLongitude = undefined;
        /** Speed in KCAS when the first engine failed during takeoff */
        this.takeoffEngineOutSpeed = undefined;
        this.checkSpeedModeMessageActive = undefined;
        this.perfClbPredToAltitudePilot = undefined;
        this.perfDesPredToAltitudePilot = undefined;

        // ATSU data
        this.atsu = undefined;
        this.holdSpeedTarget = undefined;
        this.holdIndex = undefined;
        this.holdDecelReached = undefined;
        this.setHoldSpeedMessageActive = undefined;
        this.managedProfile = undefined;
        this.speedLimitExceeded = undefined;
        this.toSpeedsNotInserted = false;
        this.toSpeedsTooLow = false;
        this.vSpeedDisagree = false;

        this.onAirport = undefined;

        // arinc bus output words
        this.arincDiscreteWord2 = FmArinc429OutputWord.empty("DISCRETE_WORD_2");
        this.arincDiscreteWord3 = FmArinc429OutputWord.empty("DISCRETE_WORD_3");
        this.arincTakeoffPitchTrim = FmArinc429OutputWord.empty("TO_PITCH_TRIM");
        this.arincLandingElevation = FmArinc429OutputWord.empty("LANDING_ELEVATION");
        this.arincDestinationLatitude = FmArinc429OutputWord.empty("DEST_LAT");
        this.arincDestinationLongitude = FmArinc429OutputWord.empty("DEST_LONG");
        this.arincMDA = FmArinc429OutputWord.empty("MINIMUM_DESCENT_ALTITUDE");
        this.arincDH = FmArinc429OutputWord.empty("DECISION_HEIGHT");
        this.arincThrustReductionAltitude = FmArinc429OutputWord.empty("THR_RED_ALT");
        this.arincAccelerationAltitude = FmArinc429OutputWord.empty("ACC_ALT");
        this.arincEoAccelerationAltitude = FmArinc429OutputWord.empty("EO_ACC_ALT");
        this.arincMissedThrustReductionAltitude = FmArinc429OutputWord.empty("MISSED_THR_RED_ALT");
        this.arincMissedAccelerationAltitude = FmArinc429OutputWord.empty("MISSED_ACC_ALT");
        this.arincMissedEoAccelerationAltitude = FmArinc429OutputWord.empty("MISSED_EO_ACC_ALT");
        this.arincTransitionAltitude = FmArinc429OutputWord.empty("TRANS_ALT");
        this.arincTransitionLevel = FmArinc429OutputWord.empty("TRANS_LVL");
        /** contains fm messages (not yet implemented) and nodh bit */
        this.arincEisWord2 = FmArinc429OutputWord.empty("EIS_DISCRETE_WORD_2");

        /** These arinc words will be automatically written to the bus, and automatically set to 0/NCD when the FMS resets */
        this.arincBusOutputs = [
            this.arincDiscreteWord2,
            this.arincDiscreteWord3,
            this.arincTakeoffPitchTrim,
            this.arincLandingElevation,
            this.arincDestinationLatitude,
            this.arincDestinationLongitude,
            this.arincMDA,
            this.arincDH,
            this.arincThrustReductionAltitude,
            this.arincAccelerationAltitude,
            this.arincEoAccelerationAltitude,
            this.arincMissedThrustReductionAltitude,
            this.arincMissedAccelerationAltitude,
            this.arincMissedEoAccelerationAltitude,
            this.arincTransitionAltitude,
            this.arincTransitionLevel,
            this.arincEisWord2,
        ];

        this.navDbIdent = null;
    }

    Init() {
        super.Init();
        this.initVariables();

        this.A32NXCore = new A32NX_Core();
        this.A32NXCore.init(this._lastTime);

        this.dataManager = new Fmgc.DataManager(this);

        this.efisInterfaces = { L: new Fmgc.EfisInterface('L', this.currFlightPlanService), R: new Fmgc.EfisInterface('R', this.currFlightPlanService) };
        this.guidanceController = new Fmgc.GuidanceController(this.bus, this, this.currFlightPlanService, this.efisInterfaces, Fmgc.a320EfisRangeSettings, Fmgc.A320AircraftConfig);
        this.navigation = new Fmgc.Navigation(this.bus, this.currFlightPlanService);
        this.efisSymbols = new Fmgc.EfisSymbols(
            this.bus,
            this.guidanceController,
            this.currFlightPlanService,
            this.navigation.getNavaidTuner(),
            this.efisInterfaces,
            Fmgc.a320EfisRangeSettings,
        );

        Fmgc.initFmgcLoop(this, this.currFlightPlanService);

        this.guidanceController.init();
        this.efisSymbols.init();
        this.navigation.init();

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

        // This is used to determine the Mach number corresponding to a CAS at the manual crossover altitude
        // The curve was calculated numerically and approximated using a few interpolated values
        this.casToMachManualCrossoverCurve = new Avionics.Curve();
        this.casToMachManualCrossoverCurve.interpolationFunction = Avionics.CurveTool.NumberInterpolation;
        this.casToMachManualCrossoverCurve.add(0, 0);
        this.casToMachManualCrossoverCurve.add(100, 0.27928);
        this.casToMachManualCrossoverCurve.add(150, 0.41551);
        this.casToMachManualCrossoverCurve.add(200, 0.54806);
        this.casToMachManualCrossoverCurve.add(250, 0.67633);
        this.casToMachManualCrossoverCurve.add(300, 0.8);
        this.casToMachManualCrossoverCurve.add(350, 0.82);

        // This is used to determine the CAS corresponding to a Mach number at the manual crossover altitude
        // Effectively, the manual crossover altitude is FL305 up to M.80, then decreases linearly to the crossover altitude of (VMO, MMO)
        this.machToCasManualCrossoverCurve = new Avionics.Curve();
        this.machToCasManualCrossoverCurve.interpolationFunction = Avionics.CurveTool.NumberInterpolation;
        this.machToCasManualCrossoverCurve.add(0, 0);
        this.machToCasManualCrossoverCurve.add(0.27928, 100);
        this.machToCasManualCrossoverCurve.add(0.41551, 150);
        this.machToCasManualCrossoverCurve.add(0.54806, 200);
        this.machToCasManualCrossoverCurve.add(0.67633, 250);
        this.machToCasManualCrossoverCurve.add(0.8, 300);
        this.machToCasManualCrossoverCurve.add(0.82, 350);

        this.updatePerfSpeeds();

        this.flightPhaseManager.init();
        this.flightPhaseManager.addOnPhaseChanged(this.onFlightPhaseChanged.bind(this));

        // Start the check routine for system health and status
        setInterval(() => {
            if (this.flightPhaseManager.phase === FmgcFlightPhases.CRUISE && !this._destDataChecked) {
                const adirLat = ADIRS.getLatitude();
                const adirLong = ADIRS.getLongitude();
                const ppos = (adirLat.isNormalOperation() && adirLong.isNormalOperation()) ? {
                    lat: ADIRS.getLatitude().value,
                    long: ADIRS.getLongitude().value,
                } : {
                    lat: NaN,
                    long: NaN
                };
                const distanceToDestination = this.getDistanceToDestination();
                if (Number.isFinite(distanceToDestination) && distanceToDestination !== -1 && distanceToDestination < 180) {
                    this._destDataChecked = true;
                    this.checkDestData();
                }
            }
        }, 15000);

        SimVar.SetSimVarValue('L:A32NX_FM_LS_COURSE', 'number', -1);

        this.navigationDatabaseService.activeDatabase.getDatabaseIdent().then((dbIdent) => this.navDbIdent = dbIdent);
    }

    initVariables(resetTakeoffData = true) {
        this.costIndex = undefined;
        this.maxCruiseFL = 390;
        this.recMaxCruiseFL = 398;
        this.routeIndex = 0;
        this.resetCoroute();
        this._overridenFlapApproachSpeed = NaN;
        this._overridenSlatApproachSpeed = NaN;
        this._routeFinalFuelWeight = 0;
        this._routeFinalFuelTime = 30;
        this._routeFinalFuelTimeDefault = 30;
        this._routeReservedWeight = 0;
        this._routeReservedPercent = 5;
        this.takeOffWeight = NaN;
        this.landingWeight = NaN;
        // +ve for tailwind, -ve for headwind
        this.averageWind = 0;
        this.perfApprQNH = NaN;
        this.perfApprTemp = NaN;
        this.perfApprWindHeading = NaN;
        this.perfApprWindSpeed = NaN;
        this.unconfirmedV1Speed = undefined;
        this.unconfirmedVRSpeed = undefined;
        this.unconfirmedV2Speed = undefined;
        this._toFlexChecked = true;
        this.toRunway = "";
        this.vApp = NaN;
        this.perfApprMDA = null;
        this.perfApprDH = null;
        this.perfApprFlaps3 = false;
        this._debug = 0;
        this._checkFlightPlan = 0;
        this._fuelPlanningPhases = {
            PLANNING: 1,
            IN_PROGRESS: 2,
            COMPLETED: 3,
        };
        this._zeroFuelWeightZFWCGEntered = false;
        this._taxiEntered = false;
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
        this._isBelowMinDestFob = false;
        this._defaultRouteFinalTime = 45;
        this._fuelPredDone = false;
        this._fuelPlanningPhase = this._fuelPlanningPhases.PLANNING;
        this._blockFuelEntered = false;
        this._initMessageSettable = false;
        this._checkWeightSettable = true;
        this._gwInitDisplayed = 0;
        /* CPDLC Fields */
        this.tropo = undefined;
        this._destDataChecked = false;
        this._towerHeadwind = 0;
        this._EfobBelowMinClr = false;
        this.simbrief = {
            route: "",
            cruiseAltitude: "",
            originIcao: "",
            destinationIcao: "",
            blockFuel: "",
            paxCount: "",
            cargo: undefined,
            payload: undefined,
            estZfw: "",
            sendStatus: "READY",
            costIndex: "",
            navlog: [],
            callsign: "",
            alternateIcao: "",
            avgTropopause: "",
            ete: "",
            blockTime: "",
            outTime: "",
            onTime: "",
            inTime: "",
            offTime: "",
            taxiFuel: "",
            tripFuel: "",
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
        this.computedVls = undefined;
        this.approachSpeeds = undefined; // based on selected config, not current config
        this._cruiseEntered = false;
        this._blockFuelEntered = false;
        this.constraintAlt = 0;
        this.fcuSelAlt = 0;
        this._forceNextAltitudeUpdate = false;
        this._lastUpdateAPTime = NaN;
        this.updateAutopilotCooldown = 0;
        this._apMasterStatus = false;
        this._lastRequestedFLCModeWaypointIndex = -1;

        this._activeCruiseFlightLevelDefaulToFcu = false;
        const payloadConstruct = new A32NX_PayloadConstructor();
        this.paxStations = payloadConstruct.paxStations;
        this.payloadStations = payloadConstruct.payloadStations;
        this.fmsUpdateThrottler = new UpdateThrottler(250);
        this._progBrgDist = undefined;
        this.preSelectedClbSpeed = undefined;
        this.preSelectedCrzSpeed = undefined;
        this.managedSpeedTarget = NaN;
        this.managedSpeedTargetIsMach = false;
        this.climbSpeedLimit = 250;
        this.climbSpeedLimitAlt = 10000;
        this.climbSpeedLimitPilot = false;
        this.descentSpeedLimit = 250;
        this.descentSpeedLimitAlt = 10000;
        this.descentSpeedLimitPilot = false;
        this.managedSpeedClimb = 290;
        this.managedSpeedClimbIsPilotEntered = false;
        this.managedSpeedClimbMach = 0.78;
        // this.managedSpeedClimbMachIsPilotEntered = false;
        this.managedSpeedCruise = 290;
        this.managedSpeedCruiseIsPilotEntered = false;
        this.managedSpeedCruiseMach = 0.78;
        // this.managedSpeedCruiseMachIsPilotEntered = false;
        this.managedSpeedDescend = 290;
        this.managedSpeedDescendPilot = undefined;
        this.managedSpeedDescendMach = 0.78;
        this.managedSpeedDescendMachPilot = undefined;
        // this.managedSpeedDescendMachIsPilotEntered = false;
        this.cruiseFlightLevelTimeOut = undefined;
        this.flightNumber = undefined;
        // this.flightNumber = undefined;
        this.cruiseTemperature = undefined;
        this.taxiFuelWeight = 0.2;
        this.blockFuel = undefined;
        this.zeroFuelWeight = undefined;
        this.zeroFuelWeightMassCenter = undefined;
        this.holdSpeedTarget = undefined;
        this.holdIndex = 0;
        this.holdDecelReached = false;
        this.setHoldSpeedMessageActive = false;
        this.managedProfile = new Map();
        this.speedLimitExceeded = false;
        this.groundTempAuto = undefined;
        this.groundTempPilot = undefined;
        this.landingElevation = undefined;
        this.destinationLatitude = undefined;
        this.destinationLongitude = undefined;
        this.toSpeedsNotInserted = false;
        this.toSpeedsTooLow = false;
        this.vSpeedDisagree = false;
        this.takeoffEngineOutSpeed = undefined;
        this.checkSpeedModeMessageActive = false;
        this.perfClbPredToAltitudePilot = undefined;
        this.perfDesPredToAltitudePilot = undefined;

        this.onAirport = () => {};

        if (this.navigation) {
            this.navigation.requiredPerformance.clearPilotRnp();
        }

        // ATSU data
        this.atsu = new AtsuFmsClient.FmsClient(this, this.flightPlanService);

        // Reset SimVars
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_MANAGED_PFD", "knots", 0);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_MANAGED_ATHR", "knots", 0);

        SimVar.SetSimVarValue("L:A32NX_MachPreselVal", "mach", -1);
        SimVar.SetSimVarValue("L:A32NX_SpeedPreselVal", "knots", -1);

        SimVar.SetSimVarValue("L:AIRLINER_DECISION_HEIGHT", "feet", -1);
        SimVar.SetSimVarValue("L:AIRLINER_MINIMUM_DESCENT_ALTITUDE", "feet", 0);

        SimVar.SetSimVarValue(
            "L:A32NX_FG_ALTITUDE_CONSTRAINT",
            "feet",
            this.constraintAlt
        );
        SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_NORMAL", "Bool", 0);
        SimVar.SetSimVarValue("L:A32NX_CABIN_READY", "Bool", 0);
        SimVar.SetSimVarValue("L:A32NX_FM_GROSS_WEIGHT", "Number", 0);

        if (
            SimVar.GetSimVarValue("L:A32NX_AUTOTHRUST_DISABLED", "number") === 1
        ) {
            SimVar.SetSimVarValue("K:A32NX.ATHR_RESET_DISABLE", "number", 1);
        }

        SimVar.SetSimVarValue("L:A32NX_PFD_MSG_SET_HOLD_SPEED", "bool", false);

        if (resetTakeoffData) {
            // FMGC Message Queue
            this._messageQueue.resetQueue();

            this.computedVgd = undefined;
            this.computedVfs = undefined;
            this.computedVss = undefined;
            this.perfTOTemp = NaN;
            this.setTakeoffFlaps(null);
            this.setTakeoffTrim(null);
            this.unconfirmedV1Speed = undefined;
            this.unconfirmedVRSpeed = undefined;
            this.unconfirmedV2Speed = undefined;
            this._toFlexChecked = true;
        }

        this.arincBusOutputs.forEach((word) => {
            word.value = 0;
            word.ssm = Arinc429Word.SignStatusMatrix.NoComputedData;
        });

        this.toSpeedsChecks(true);

        this.setRequest('FMGC');
    }

    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);

        // this.flightPlanManager.update(_deltaTime);
        const flightPlanChanged = this.flightPlanService.activeOrTemporary.version !== this.lastFlightPlanVersion;
        if (flightPlanChanged) {
            this.lastFlightPlanVersion = this.flightPlanService.activeOrTemporary.version;
            this.setRequest("FMGC");
        }

        Fmgc.updateFmgcLoop(_deltaTime);

        if (this._debug++ > 180) {
            this._debug = 0;
        }
        const flightPhaseManagerDelta = this.flightPhaseUpdateThrottler.canUpdate(_deltaTime);
        if (flightPhaseManagerDelta !== -1) {
            this.flightPhaseManager.shouldActivateNextPhase(flightPhaseManagerDelta);
        }

        if (this.fmsUpdateThrottler.canUpdate(_deltaTime) !== -1) {
            this.checkSpeedLimit();
            this.navigation.update(_deltaTime);
            this.getGW();
            this.checkGWParams();
            this.toSpeedsChecks();
            this.thrustReductionAccelerationChecks();
            this.updateThrustReductionAcceleration();
            this.updateTransitionAltitudeLevel();
            this.updateMinimums();
            this.updateIlsCourse();
            this.updatePerfPageAltPredictions();
            this.checkEFOBBelowMin();
        }

        this.A32NXCore.update();

        if (flightPlanChanged) {
            this.updateManagedProfile();
            this.updateDestinationData();
        }

        this.updateAutopilot();

        if (this._progBrgDistUpdateThrottler.canUpdate(_deltaTime) !== -1) {
            this.updateProgDistance();
        }

        if (this.guidanceController) {
            this.guidanceController.update(_deltaTime);
        }

        if (this.efisSymbols) {
            this.efisSymbols.update(_deltaTime);
        }
        this.arincBusOutputs.forEach((word) => word.writeToSimVarIfDirty());
    }

    onFmPowerStateChanged(newState) {
        SimVar.SetSimVarValue('L:A32NX_FM1_HEALTHY_DISCRETE', 'boolean', newState);
        SimVar.SetSimVarValue('L:A32NX_FM2_HEALTHY_DISCRETE', 'boolean', newState);
    }

    async switchNavDatabase() {
        // Only performing a reset of the MCDU for now, no secondary database
        // Speed AP returns to selected
        //const isSelected = Simplane.getAutoPilotAirspeedSelected();
        //if (isSelected == false)
        //    SimVar.SetSimVarValue("H:A320_Neo_FCU_SPEED_PULL", "boolean", 1);
        // flight plan
        this.resetCoroute();
        this.atsu.resetAtisAutoUpdate();
        await this.flightPlanService.reset();
        // stored data
        this.dataManager.deleteAllStoredWaypoints();
        // Reset MCDU apart from TakeOff config
        this.initVariables(false);

        this.navigation.resetState();
    }

    /**
     * This method is called by the FlightPhaseManager after a flight phase change
     * This method initializes AP States, initiates CDUPerformancePage changes and other set other required states
     * @param prevPhase {FmgcFlightPhases} Previous FmgcFlightPhase
     * @param nextPhase {FmgcFlightPhases} New FmgcFlightPhase
     */
    onFlightPhaseChanged(prevPhase, nextPhase) {
        this.updateConstraints();
        this.updateManagedSpeed();

        this.setRequest("FMGC");

        SimVar.SetSimVarValue("L:A32NX_CABIN_READY", "Bool", 0);

        switch (nextPhase) {
            case FmgcFlightPhases.TAKEOFF: {
                this._destDataChecked = false;

                const plan = this.flightPlanService.active;

                if (plan.performanceData.accelerationAltitude === null) {
                    // it's important to set this immediately as we don't want to immediately sequence to the climb phase
                    plan.setPerformanceData('pilotAccelerationAltitude', SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') + parseInt(NXDataStore.get("CONFIG_ACCEL_ALT", "1500")));
                    this.updateThrustReductionAcceleration();
                }
                if (plan.performanceData.engineOutAccelerationAltitude === null) {
                    // it's important to set this immediately as we don't want to immediately sequence to the climb phase
                    plan.setPerformanceData('pilotEngineOutAccelerationAltitude', SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') + parseInt(NXDataStore.get("CONFIG_ACCEL_ALT", "1500")));
                    this.updateThrustReductionAcceleration();
                }

                if (this.page.Current === this.page.PerformancePageTakeoff) {
                    CDUPerformancePage.ShowTAKEOFFPage(this);
                } else if (this.page.Current === this.page.ProgressPage) {
                    CDUProgressPage.ShowPage(this);
                }

                /** Arm preselected speed/mach for next flight phase */
                this.updatePreSelSpeedMach(this.preSelectedClbSpeed);

                this._rteRsvPercentOOR = false;
                this._rteReservedWeightEntered = false;
                this._rteReservedPctEntered = false;

                break;
            }

            case FmgcFlightPhases.CLIMB: {

                this._destDataChecked = false;

                if (this.page.Current === this.page.ProgressPage) {
                    CDUProgressPage.ShowPage(this);
                } else {
                    this.tryUpdatePerfPage(prevPhase, nextPhase);
                }

                /** Activate pre selected speed/mach */
                if (prevPhase === FmgcFlightPhases.TAKEOFF) {
                    this.activatePreSelSpeedMach(this.preSelectedClbSpeed);
                }

                /** Arm preselected speed/mach for next flight phase */
                this.updatePreSelSpeedMach(this.preSelectedCrzSpeed);

                if (!this.cruiseLevel) {
                    this.cruiseLevel = Simplane.getAutoPilotDisplayedAltitudeLockValue('feet') / 100;
                }

                break;
            }

            case FmgcFlightPhases.CRUISE: {
                if (this.page.Current === this.page.ProgressPage) {
                    CDUProgressPage.ShowPage(this);
                } else {
                    this.tryUpdatePerfPage(prevPhase, nextPhase);
                }

                SimVar.SetSimVarValue("L:A32NX_GOAROUND_PASSED", "bool", 0);
                Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO).catch(console.error).catch(console.error);

                /** Activate pre selected speed/mach */
                if (prevPhase === FmgcFlightPhases.CLIMB) {
                    this.triggerCheckSpeedModeMessage(this.preSelectedCrzSpeed);
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
                    this.tryUpdatePerfPage(prevPhase, nextPhase);
                }

                this.checkDestData();

                Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO).catch(console.error).catch(console.error);

                this.triggerCheckSpeedModeMessage(undefined);

                this.cruiseLevel = null;

                break;
            }

            case FmgcFlightPhases.APPROACH: {
                if (this.page.Current === this.page.ProgressPage) {
                    CDUProgressPage.ShowPage(this);
                } else {
                    this.tryUpdatePerfPage(prevPhase, nextPhase);
                }

                // I think this is not necessary to port, as it only calls fs9gps stuff (fms-v2)
                // this.flightPlanManager.activateApproach().catch(console.error);

                Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO).catch(console.error);
                SimVar.SetSimVarValue("L:A32NX_GOAROUND_PASSED", "bool", 0);

                this.checkDestData();

                break;
            }

            case FmgcFlightPhases.GOAROUND: {
                SimVar.SetSimVarValue("L:A32NX_GOAROUND_INIT_SPEED", "number", Simplane.getIndicatedSpeed());

                this.flightPlanService.stringMissedApproach(/** @type {FlightPlanLeg} */ (map) => {
                    this.addMessageToQueue(NXSystemMessages.cstrDelUpToWpt.getModifiedMessage(map.ident));
                });

                const activePlan = this.flightPlanService.active;
                if (activePlan.performanceData.missedAccelerationAltitude === null) {
                    // it's important to set this immediately as we don't want to immediately sequence to the climb phase
                    activePlan.setPerformanceData('pilotMissedAccelerationAltitude', SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') + parseInt(NXDataStore.get("CONFIG_ENG_OUT_ACCEL_ALT", "1500")));
                    this.updateThrustReductionAcceleration();
                }
                if (activePlan.performanceData.missedEngineOutAccelerationAltitude === null) {
                    // it's important to set this immediately as we don't want to immediately sequence to the climb phase
                    activePlan.setPerformanceData('pilotMissedEngineOutAccelerationAltitude', SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') + parseInt(NXDataStore.get("CONFIG_ENG_OUT_ACCEL_ALT", "1500")));
                    this.updateThrustReductionAcceleration();
                }

                if (this.page.Current === this.page.ProgressPage) {
                    CDUProgressPage.ShowPage(this);
                } else {
                    this.tryUpdatePerfPage(prevPhase, nextPhase);
                }

                break;
            }

            case FmgcFlightPhases.DONE:
                CDUIdentPage.ShowPage(this);

                this.flightPlanService.reset().then(() => {
                    this.initVariables();
                    this.dataManager.deleteAllStoredWaypoints();
                    this.setScratchpadText('');
                    SimVar.SetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool', true).then(() => {
                        CDUIdentPage.ShowPage(this);
                    });
                }).catch(console.error);
                break;
        }
    }

    triggerCheckSpeedModeMessage(preselectedSpeed) {
        const isSpeedSelected = !Simplane.getAutoPilotAirspeedManaged();
        const hasPreselectedSpeed = preselectedSpeed !== undefined;

        if (!this.checkSpeedModeMessageActive && isSpeedSelected && !hasPreselectedSpeed) {
            this.checkSpeedModeMessageActive = true;
            this.addMessageToQueue(
                NXSystemMessages.checkSpeedMode,
                () => !this.checkSpeedModeMessageActive,
                () => {
                    this.checkSpeedModeMessageActive = false;
                    SimVar.SetSimVarValue("L:A32NX_PFD_MSG_CHECK_SPEED_MODE", "bool", false);
                },
            );
            SimVar.SetSimVarValue("L:A32NX_PFD_MSG_CHECK_SPEED_MODE", "bool", true);
        }
    }

    clearCheckSpeedModeMessage() {
        if (this.checkSpeedModeMessageActive && Simplane.getAutoPilotAirspeedManaged()) {
            this.checkSpeedModeMessageActive = false;
            this.removeMessageFromQueue(NXSystemMessages.checkSpeedMode.text);
            SimVar.SetSimVarValue("L:A32NX_PFD_MSG_CHECK_SPEED_MODE", "bool", false);
        }
    }

    /** FIXME these functions are in the new VNAV but not in this branch, remove when able */
    /**
     *
     * @param {Feet} alt geopotential altitude
     * @returns °C
     */
    getIsaTemp(alt) {
        if (alt > (this.tropo ? this.tropo : 36090)) {
            return -56.5;
        }
        return 15 - (0.0019812 * alt);
    }

    /**
     *
     * @param {Feet} alt geopotential altitude
     * @param {Degrees} isaDev temperature deviation from ISA conditions
     * @returns °C
     */
    getTemp(alt, isaDev = 0) {
        return this.getIsaTemp(alt) + isaDev;
    }

    /**
     *
     * @param {Feet} alt geopotential altitude
     * @param {Degrees} isaDev temperature deviation from ISA conditions
     * @returns hPa
     */
    getPressure(alt, isaDev = 0) {
        if (alt > (this.tropo ? this.tropo : 36090)) {
            return ((216.65 + isaDev) / 288.15) ** 5.25588 * 1013.2;
        }
        return ((288.15 - 0.0019812 * alt + isaDev) / 288.15) ** 5.25588 * 1013.2;
    }

    getPressureAltAtElevation(elev, qnh = 1013.2) {
        const p0 = qnh < 500 ? 29.92 : 1013.2;
        return elev + 145442.15 * (1 - Math.pow((qnh / p0), 0.190263));
    }

    getPressureAlt() {
        for (let n = 1; n <= 3; n++) {
            const zp = Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_ADR_${n}_ALTITUDE`);
            if (zp.isNormalOperation()) {
                return zp.value;
            }
        }
        return null;
    }

    getBaroCorrection1() {
        // FIXME hook up to ADIRU or FCU
        return Simplane.getPressureValue("millibar");
    }

    /**
     * @returns {Degrees} temperature deviation from ISA conditions
     */
    getIsaDeviation() {
        const geoAlt = SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');
        const temperature = SimVar.GetSimVarValue('AMBIENT TEMPERATURE', 'celsius');
        return temperature - this.getIsaTemp(geoAlt);
    }
    /** FIXME ^these functions are in the new VNAV but not in this branch, remove when able */

    // TODO better decel distance calc
    calculateDecelDist(fromSpeed, toSpeed) {
        return Math.min(20, Math.max(3, (fromSpeed - toSpeed) * 0.15));
    }

    /*
        When the aircraft is in the holding, predictions assume that the leg is flown at holding speed
        with a vertical speed equal to - 1000 ft/mn until reaching a restrictive altitude constraint, the
        FCU altitude or the exit fix. If FCU or constraint altitude is reached first, the rest of the
        pattern is assumed to be flown level at that altitude
        */
    getHoldingSpeed(speedConstraint = undefined, altitude = undefined) {
        const fcuAltitude = SimVar.GetSimVarValue('AUTOPILOT ALTITUDE LOCK VAR:3', 'feet');
        const alt = Math.max(fcuAltitude, altitude ? altitude : 0);

        let kcas = SimVar.GetSimVarValue('L:A32NX_SPEEDS_GD', 'number');
        if (this.flightPhaseManager.phase === FmgcFlightPhases.APPROACH) {
            kcas = this.getAppManagedSpeed();
        }

        if (speedConstraint > 100) {
            kcas = Math.min(kcas, speedConstraint);
        }

        // apply icao limits
        if (alt < 14000) {
            kcas = Math.min(230, kcas);
        } else if (alt < 20000) {
            kcas = Math.min(240, kcas);
        } else if (alt < 34000) {
            kcas = Math.min(265, kcas);
        } else {
            const isaDeviation = this.getIsaDeviation();
            const temperature = 273.15 + this.getTemp(alt, isaDeviation);
            const pressure = this.getPressure(alt, isaDeviation);
            kcas = Math.min(
                _convertMachToKCas(0.83, temperature, pressure),
                kcas,
            );
        }

        // apply speed limit/alt
        if (this.flightPhaseManager.phase <= FmgcFlightPhases.CRUISE) {
            if (this.climbSpeedLimit !== undefined && alt <= this.climbSpeedLimitAlt) {
                kcas = Math.min(this.climbSpeedLimit, kcas);
            }
        } else if (this.flightPhaseManager.phase < FmgcFlightPhases.GOAROUND) {
            if (this.descentSpeedLimit !== undefined && alt <= this.descentSpeedLimitAlt) {
                kcas = Math.min(this.descentSpeedLimit, kcas);
            }
        }

        kcas = Math.max(kcas, this.computedVls);

        return Math.ceil(kcas);
    }

    updateHoldingSpeed() {
        /**
         * @type {BaseFlightPlan}
         */
        const plan = this.flightPlanService.active;
        const currentLegIndex = plan.activeLegIndex;
        const nextLegIndex = currentLegIndex + 1;
        const currentLegConstraints = this.managedProfile.get(currentLegIndex) || {};
        const nextLegConstraints = this.managedProfile.get(nextLegIndex) || {};

        const currentLeg = plan.maybeElementAt(currentLegIndex);
        const nextLeg = plan.maybeElementAt(nextLegIndex);

        const casWord = ADIRS.getCalibratedAirspeed();
        const cas = casWord.isNormalOperation() ? casWord.value : 0;

        let enableHoldSpeedWarning = false;
        let holdSpeedTarget = 0;
        let holdDecelReached = this.holdDecelReached;
        // FIXME big hack until VNAV can do this
        if (currentLeg && currentLeg.isDiscontinuity === false && currentLeg.type === 'HM') {
            holdSpeedTarget = this.getHoldingSpeed(currentLegConstraints.descentSpeed, currentLegConstraints.descentAltitude);
            holdDecelReached = true;
            enableHoldSpeedWarning = !Simplane.getAutoPilotAirspeedManaged();
            this.holdIndex = plan.activeLegIndex;
        } else if (nextLeg && nextLeg.isDiscontinuity === false && nextLeg.type === 'HM') {
            const adirLat = ADIRS.getLatitude();
            const adirLong = ADIRS.getLongitude();

            if (adirLat.isNormalOperation() && adirLong.isNormalOperation()) {
                holdSpeedTarget = this.getHoldingSpeed(nextLegConstraints.descentSpeed, nextLegConstraints.descentAltitude);

                const dtg = this.guidanceController.activeLegDtg;
                // decel range limits are [3, 20] NM
                const decelDist = this.calculateDecelDist(cas, holdSpeedTarget);
                if (dtg < decelDist) {
                    holdDecelReached = true;
                }

                const gsWord = ADIRS.getGroundSpeed();
                const gs = gsWord.isNormalOperation() ? gsWord.value : 0;
                const warningDist = decelDist + gs / 120;
                if (!Simplane.getAutoPilotAirspeedManaged() && dtg <= warningDist) {
                    enableHoldSpeedWarning = true;
                }
            }
            this.holdIndex = plan.activeLegIndex + 1;
        } else {
            this.holdIndex = 0;
            holdDecelReached = false;
        }

        if (holdDecelReached !== this.holdDecelReached) {
            this.holdDecelReached = holdDecelReached;
            SimVar.SetSimVarValue('L:A32NX_FM_HOLD_DECEL', 'bool', this.holdDecelReached);
        }

        if (holdSpeedTarget !== this.holdSpeedTarget) {
            this.holdSpeedTarget = holdSpeedTarget;
            SimVar.SetSimVarValue('L:A32NX_FM_HOLD_SPEED', 'number', this.holdSpeedTarget);
        }

        if (enableHoldSpeedWarning && (cas - this.holdSpeedTarget) > 5) {
            if (!this.setHoldSpeedMessageActive) {
                this.setHoldSpeedMessageActive = true;
                this.addMessageToQueue(
                    NXSystemMessages.setHoldSpeed,
                    () => !this.setHoldSpeedMessageActive,
                    () => SimVar.SetSimVarValue("L:A32NX_PFD_MSG_SET_HOLD_SPEED", "bool", false),
                );
                SimVar.SetSimVarValue("L:A32NX_PFD_MSG_SET_HOLD_SPEED", "bool", true);
            }
        } else if (this.setHoldSpeedMessageActive) {
            SimVar.SetSimVarValue("L:A32NX_PFD_MSG_SET_HOLD_SPEED", "bool", false);
            this.setHoldSpeedMessageActive = false;
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

        this.managedSpeedDescend = this.getDesManagedSpeedFromCostIndex();
    }

    updateManagedSpeed() {
        let vPfd = 0;
        let isMach = false;

        this.updateHoldingSpeed();
        this.clearCheckSpeedModeMessage();

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
                this.managedSpeedTarget = SimVar.GetSimVarValue("L:A32NX_FLAPS_HANDLE_INDEX", "Number") === 0 ? Math.min(340, SimVar.GetGameVarValue("FROM MACH TO KIAS", "number", 0.8)) : SimVar.GetSimVarValue("L:A32NX_SPEEDS_VMAX", "number") - 10;
            }
            vPfd = this.managedSpeedTarget;
        } else if (this.holdDecelReached) {
            vPfd = this.holdSpeedTarget;
            this.managedSpeedTarget = this.holdSpeedTarget;
        } else {
            if (this.setHoldSpeedMessageActive) {
                this.setHoldSpeedMessageActive = false;
                SimVar.SetSimVarValue("L:A32NX_PFD_MSG_SET_HOLD_SPEED", "bool", false);
                this.removeMessageFromQueue(NXSystemMessages.setHoldSpeed.text);
            }

            const engineOut = !this.isAllEngineOn();

            switch (this.flightPhaseManager.phase) {
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
                        this.managedSpeedTarget = engineOut
                            ? Math.min(this.v2Speed + 15, Math.max(this.v2Speed, this.takeoffEngineOutSpeed ? this.takeoffEngineOutSpeed : 0))
                            : this.v2Speed + 10;
                    }
                    break;
                }
                case FmgcFlightPhases.CLIMB: {
                    let speed = this.managedSpeedClimb;

                    if (this.climbSpeedLimit !== undefined && SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet") < this.climbSpeedLimitAlt) {
                        speed = Math.min(speed, this.climbSpeedLimit);
                    }

                    speed = Math.min(speed, this.getSpeedConstraint());

                    [this.managedSpeedTarget, isMach] = this.getManagedTargets(speed, this.managedSpeedClimbMach);
                    vPfd = this.managedSpeedTarget;
                    break;
                }
                case FmgcFlightPhases.CRUISE: {
                    let speed = this.managedSpeedCruise;

                    if (this.climbSpeedLimit !== undefined && SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet") < this.climbSpeedLimitAlt) {
                        speed = Math.min(speed, this.climbSpeedLimit);
                    }

                    [this.managedSpeedTarget, isMach] = this.getManagedTargets(speed, this.managedSpeedCruiseMach);
                    vPfd = this.managedSpeedTarget;
                    break;
                }
                case FmgcFlightPhases.DESCENT: {
                    // We fetch this data from VNAV
                    vPfd = SimVar.GetSimVarValue("L:A32NX_SPEEDS_MANAGED_PFD", "knots");
                    this.managedSpeedTarget = SimVar.GetSimVarValue("L:A32NX_SPEEDS_MANAGED_ATHR", "knots");

                    // Whether to use Mach or not should be based on the original managed speed, not whatever VNAV uses under the hood to vary it.
                    // Also, VNAV already does the conversion from Mach if necessary
                    isMach = this.getManagedTargets(this.getManagedDescentSpeed(), this.getManagedDescentSpeedMach())[1];
                    break;
                }
                case FmgcFlightPhases.APPROACH: {
                    // the displayed target is Vapp (with GSmini)
                    // the guidance target is lower limited by FAC manouvering speeds (O, S, F) unless in landing config
                    // constraints are not considered
                    const speed = this.getAppManagedSpeed();
                    vPfd = this.getVAppGsMini();

                    this.managedSpeedTarget = Math.max(speed, vPfd);
                    break;
                }
                case FmgcFlightPhases.GOAROUND: {
                    if (SimVar.GetSimVarValue("L:A32NX_FMA_VERTICAL_MODE", "number") === 41 /* SRS GA */) {
                        const speed = Math.min(
                            this.computedVls + (engineOut ? 15 : 25),
                            Math.max(
                                SimVar.GetSimVarValue("L:A32NX_GOAROUND_INIT_SPEED", "number"),
                                this.getVApp(),
                            ),
                            SimVar.GetSimVarValue("L:A32NX_SPEEDS_VMAX", "number") - 5,
                        );

                        vPfd = speed;
                        this.managedSpeedTarget = speed;
                    } else {
                        const speedConstraint = this.getSpeedConstraint();
                        const speed = Math.min(this.computedVgd, speedConstraint);

                        vPfd = speed;
                        this.managedSpeedTarget = speed;
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
            Coherent.call("AP_SPD_VAR_SET", 0, Vtap).catch(console.error);
        }

        // Reset V1/R/2 speed after the TAKEOFF phase
        if (this.flightPhaseManager.phase > FmgcFlightPhases.TAKEOFF) {
            this.v1Speed = null;
            this.vrSpeed = null;
            this.v2Speed = null;
        }
    }

    activatePreSelSpeedMach(preSel) {
        if (preSel) {
            SimVar.SetSimVarValue("K:A32NX.FMS_PRESET_SPD_ACTIVATE", "number", 1);
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

    checkSpeedLimit() {
        let speedLimit;
        let speedLimitAlt;
        switch (this.flightPhaseManager.phase) {
            case FmgcFlightPhases.CLIMB:
            case FmgcFlightPhases.CRUISE:
                speedLimit = this.climbSpeedLimit;
                speedLimitAlt = this.climbSpeedLimitAlt;
                break;
            case FmgcFlightPhases.DESCENT:
                speedLimit = this.descentSpeedLimit;
                speedLimitAlt = this.descentSpeedLimitAlt;
                break;
            default:
                // no speed limit in other phases
                this.speedLimitExceeded = false;
                return;
        }

        if (speedLimit === undefined) {
            this.speedLimitExceeded = false;
            return;
        }

        const cas = ADIRS.getCalibratedAirspeed();
        const alt = ADIRS.getBaroCorrectedAltitude();

        if (this.speedLimitExceeded) {
            const resetLimitExceeded = !cas.isNormalOperation() || !alt.isNormalOperation() || alt.value > speedLimitAlt || cas.value <= (speedLimit + 5);
            if (resetLimitExceeded) {
                this.speedLimitExceeded = false;
                this.removeMessageFromQueue(NXSystemMessages.spdLimExceeded.text);
            }
        } else if (cas.isNormalOperation() && alt.isNormalOperation()) {
            const setLimitExceeded = alt.value < (speedLimitAlt - 150) && cas.value > (speedLimit + 10);
            if (setLimitExceeded) {
                this.speedLimitExceeded = true;
                this.addMessageToQueue(NXSystemMessages.spdLimExceeded, () => !this.speedLimitExceeded);
            }
        }
    }

    updateAutopilot() {
        const now = performance.now();
        const dt = now - this._lastUpdateAPTime;
        let apLogicOn = (this._apMasterStatus || Simplane.getAutoPilotFlightDirectorActive(1));
        this._lastUpdateAPTime = now;
        if (isFinite(dt)) {
            this.updateAutopilotCooldown -= dt;
        }
        if (SimVar.GetSimVarValue("L:AIRLINER_FMC_FORCE_NEXT_UPDATE", "number") === 1) {
            SimVar.SetSimVarValue("L:AIRLINER_FMC_FORCE_NEXT_UPDATE", "number", 0);
            this.updateAutopilotCooldown = -1;
        }

        if (this.flightPhaseManager.phase === FmgcFlightPhases.TAKEOFF && !this.isAllEngineOn() && this.takeoffEngineOutSpeed === undefined) {
            const casWord = ADIRS.getCalibratedAirspeed();
            this.takeoffEngineOutSpeed = casWord.isNormalOperation() ? casWord.value : undefined;
        }

        if (this.updateAutopilotCooldown < 0) {
            this.updatePerfSpeeds();
            this.updateConstraints();
            this.updateManagedSpeed();
            const currentApMasterStatus = SimVar.GetSimVarValue("AUTOPILOT MASTER", "boolean");
            if (currentApMasterStatus !== this._apMasterStatus) {
                this._apMasterStatus = currentApMasterStatus;
                apLogicOn = (this._apMasterStatus || Simplane.getAutoPilotFlightDirectorActive(1));
                this._forceNextAltitudeUpdate = true;
                console.log("Enforce AP in Altitude Lock mode. Cause : AP Master Status has changed.");
                SimVar.SetSimVarValue("L:A320_NEO_FCU_FORCE_IDLE_VS", "Number", 1);
                if (this._apMasterStatus) {
                    if (this.flightPlanService.hasActive && this.flightPlanService.active.legCount === 0) {
                        this._onModeSelectedAltitude();
                        this._onModeSelectedHeading();
                    }
                }
            }
            if (apLogicOn) {
                if (!Simplane.getAutoPilotFLCActive() && !SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD", "Boolean")) {
                    SimVar.SetSimVarValue("K:AP_PANEL_SPEED_HOLD", "Number", 1);
                }
                if (!SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean")) {
                    if (!SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Boolean")) {
                        SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "Number", 1);
                    }
                }
            }

            if (this.isAltitudeManaged()) {
                const plan = this.flightPlanService.active;

                const prevWaypoint = plan.hasElement(plan.activeLegIndex - 1);
                const nextWaypoint = plan.hasElement(plan.activeLegIndex + 1);

                if (prevWaypoint && nextWaypoint) {
                    const activeWpIdx = plan.activeLegIndex;

                    if (activeWpIdx !== this.activeWpIdx) {
                        this.activeWpIdx = activeWpIdx;
                        this.updateConstraints();
                    }
                    if (this.constraintAlt) {
                        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, this.constraintAlt, this._forceNextAltitudeUpdate).catch(console.error);
                        this._forceNextAltitudeUpdate = false;
                    } else {
                        const altitude = Simplane.getAutoPilotSelectedAltitudeLockValue("feet");
                        if (isFinite(altitude)) {
                            Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, altitude, this._forceNextAltitudeUpdate).catch(console.error);
                            this._forceNextAltitudeUpdate = false;
                        }
                    }
                } else {
                    const altitude = Simplane.getAutoPilotSelectedAltitudeLockValue("feet");
                    if (isFinite(altitude)) {
                        SimVar.SetSimVarValue("L:A32NX_FG_ALTITUDE_CONSTRAINT", "feet", 0);
                        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, altitude, this._forceNextAltitudeUpdate).catch(console.error);
                        this._forceNextAltitudeUpdate = false;
                    }
                }
            }

            if (Simplane.getAutoPilotAltitudeManaged() && this.flightPlanService.hasActive && SimVar.GetSimVarValue("L:A320_NEO_FCU_STATE", "number") !== 1) {
                const currentWaypointIndex = this.flightPlanService.active.activeLegIndex;
                if (currentWaypointIndex !== this._lastRequestedFLCModeWaypointIndex) {
                    this._lastRequestedFLCModeWaypointIndex = currentWaypointIndex;
                    setTimeout(() => {
                        if (Simplane.getAutoPilotAltitudeManaged()) {
                            this._onModeManagedAltitude();
                        }
                    }, 1000);
                }
            }

            if (this.flightPhaseManager.phase === FmgcFlightPhases.GOAROUND && apLogicOn) {
                //depending if on HDR/TRK or NAV mode, select appropriate Alt Mode (WIP)
                //this._onModeManagedAltitude();
                this._onModeSelectedAltitude();
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
        const vnavPrediction = this.guidanceController.vnavDriver.getDestinationPrediction();
        // Actual weight is used during approach phase (FCOM bulletin 46/2), and we also assume during go-around
        // Fallback gross weight set to 64.3T (MZFW), which is replaced by FMGW once input in FMS to avoid function returning undefined results.
        if (this.flightPhaseManager.phase >= FmgcFlightPhases.APPROACH || !isFinite(weight)) {
            weight = (this.getGW() == 0) ? 64.3 : this.getGW();
        } else if (vnavPrediction && Number.isFinite(vnavPrediction.estimatedFuelOnBoard)) {
            weight = this.zeroFuelWeight + Math.max(0, vnavPrediction.estimatedFuelOnBoard * 0.4535934 / 1000);
        }
        // if pilot has set approach wind in MCDU we use it, otherwise fall back to current measured wind
        if (isFinite(this.perfApprWindSpeed) && isFinite(this.perfApprWindHeading)) {
            this.approachSpeeds = new NXSpeedsApp(weight, this.perfApprFlaps3, this._towerHeadwind);
        } else {
            this.approachSpeeds = new NXSpeedsApp(weight, this.perfApprFlaps3);
        }
        this.approachSpeeds.valid = this.flightPhaseManager.phase >= FmgcFlightPhases.APPROACH || isFinite(weight);
    }

    updateConstraints() {
        const activeFpIndex = this.flightPlanService.activeLegIndex;
        const constraints = this.managedProfile.get(activeFpIndex);
        const fcuSelAlt = Simplane.getAutoPilotDisplayedAltitudeLockValue("feet");

        let constraintAlt = 0;
        if (constraints) {
            // Altitude constraints are not sent in GA phase. While we cannot engage CLB anyways, ALT counts as a managed mode, so we don't want to show
            // a magenta altitude in ALT due to a constraint
            if ((this.flightPhaseManager.phase < FmgcFlightPhases.CRUISE) && isFinite(constraints.climbAltitude) && constraints.climbAltitude < fcuSelAlt) {
                constraintAlt = constraints.climbAltitude;
            }

            if ((this.flightPhaseManager.phase > FmgcFlightPhases.CRUISE && this.flightPhaseManager.phase < FmgcFlightPhases.GOAROUND) && isFinite(constraints.descentAltitude) && constraints.descentAltitude > fcuSelAlt) {
                constraintAlt = constraints.descentAltitude;
            }
        }

        if (constraintAlt !== this.constraintAlt) {
            this.constraintAlt = constraintAlt;
            SimVar.SetSimVarValue("L:A32NX_FG_ALTITUDE_CONSTRAINT", "feet", this.constraintAlt);
        }
    }

    // TODO/VNAV: Speed constraint
    getSpeedConstraint() {
        if (!this.navModeEngaged()) {
            return Infinity;
        }

        return this.getNavModeSpeedConstraint();
    }

    getNavModeSpeedConstraint() {
        const activeLegIndex = this.guidanceController.activeTransIndex >= 0 ? this.guidanceController.activeTransIndex : this.guidanceController.activeLegIndex;
        const constraints = this.managedProfile.get(activeLegIndex);
        if (constraints) {
            if (this.flightPhaseManager.phase < FmgcFlightPhases.CRUISE || this.flightPhaseManager.phase === FmgcFlightPhases.GOAROUND) {
                return constraints.climbSpeed;
            }

            if (this.flightPhaseManager.phase > FmgcFlightPhases.CRUISE && this.flightPhaseManager.phase < FmgcFlightPhases.GOAROUND) {
                // FIXME proper decel calc
                if (this.guidanceController.activeLegDtg < this.calculateDecelDist(Math.min(constraints.previousDescentSpeed, this.getManagedDescentSpeed()), constraints.descentSpeed)) {
                    return constraints.descentSpeed;
                } else {
                    return constraints.previousDescentSpeed;
                }
            }
        }

        return Infinity;
    }

    updateManagedProfile() {
        this.managedProfile.clear();

        const plan = this.flightPlanService.active;

        const origin = plan.originAirport;
        const destination = plan.destinationAirport;
        const destinationElevation = destination ? destination.location.alt : 0;

        // TODO should we save a constraint already propagated to the current leg?

        // propagate descent speed constraints forward
        let currentSpeedConstraint = Infinity;
        let previousSpeedConstraint = Infinity;
        for (let index = 0; index < Math.min(plan.firstMissedApproachLegIndex, plan.legCount); index++) {
            const leg = plan.elementAt(index);

            if (leg.isDiscontinuity === true) {
                continue;
            }

            if (leg.constraintType === 2 /** DES */) {
                if (leg.speedConstraint) {
                    currentSpeedConstraint = Math.min(currentSpeedConstraint, Math.round(leg.speedConstraint.speed));
                }
            }

            this.managedProfile.set(index, {
                descentSpeed: currentSpeedConstraint,
                previousDescentSpeed: previousSpeedConstraint,
                climbSpeed: Infinity,
                previousClimbSpeed: Infinity,
                climbAltitude: Infinity,
                descentAltitude: -Infinity,
            });

            previousSpeedConstraint = currentSpeedConstraint;
        }

        // propagate climb speed constraints backward
        // propagate alt constraints backward
        currentSpeedConstraint = Infinity;
        previousSpeedConstraint = Infinity;
        let currentDesConstraint = -Infinity;
        let currentClbConstraint = Infinity;

        for (let index = Math.min(plan.firstMissedApproachLegIndex, plan.legCount) - 1; index >= 0; index--) {
            const leg = plan.elementAt(index);

            if (leg.isDiscontinuity === true) {
                continue;
            }

            const altConstraint = leg.altitudeConstraint;
            const speedConstraint = leg.speedConstraint;

            if (leg.constraintType === 1 /** CLB */) {
                if (speedConstraint) {
                    currentSpeedConstraint = Math.min(currentSpeedConstraint, Math.round(speedConstraint.speed));
                }

                if (altConstraint) {
                    switch (altConstraint.altitudeDescriptor) {
                        case "@": // at alt 1
                        case "-": // at or below alt 1
                        case "B": // between alt 1 and alt 2
                            currentClbConstraint = Math.min(currentClbConstraint, Math.round(altConstraint.altitude1));
                            break;
                        default:
                            // not constraining
                    }
                }
            } else if (leg.constraintType === 2 /** DES */) {
                if (altConstraint) {
                    switch (altConstraint.altitudeDescriptor) {
                        case "@": // at alt 1
                        case "+": // at or above alt 1
                        case "I": // alt1 is at for FACF, Alt2 is glidelope intercept
                        case "J": // alt1 is at or above for FACF, Alt2 is glideslope intercept
                        case "V": // alt1 is procedure alt for step-down, Alt2 is at alt for vertical path angle
                        case "X": // alt 1 is at, Alt 2 is on the vertical angle
                            currentDesConstraint = Math.max(currentDesConstraint, Math.round(altConstraint.altitude1));
                            break;
                        case "B": // between alt 1 and alt 2
                            currentDesConstraint = Math.max(currentDesConstraint, Math.round(altConstraint.altitude2));
                            break;
                        default:
                            // not constraining
                    }
                }
            }

            const profilePoint = this.managedProfile.get(index);
            profilePoint.climbSpeed = currentSpeedConstraint;
            profilePoint.previousClimbSpeed = previousSpeedConstraint;
            profilePoint.climbAltitude = currentClbConstraint;
            profilePoint.descentAltitude = Math.max(destinationElevation, currentDesConstraint);
            previousSpeedConstraint = currentSpeedConstraint;
        }
    }

    async updateDestinationData() {
        let landingElevation;
        let latitude;
        let longitude;

        /** @type {import('msfs-navdata').Runway} */
        const runway = this.flightPlanService.active.destinationRunway;

        if (runway) {
            landingElevation = runway.thresholdLocation.alt;
            latitude = runway.thresholdLocation.lat;
            longitude = runway.thresholdLocation.long;
        } else {
            /** @type {import('msfs-navdata').Airport} */
            const airport = this.flightPlanService.active.destinationAirport;

            if (airport) {
                const ele = airport.location.alt;

                landingElevation = isFinite(ele) ? ele : undefined;
                latitude = airport.location.lat;
                longitude = airport.location.long;
            }
        }

        if (this.landingElevation !== landingElevation) {
            this.landingElevation = landingElevation;

            const ssm = landingElevation !== undefined ? Arinc429Word.SignStatusMatrix.NormalOperation : Arinc429Word.SignStatusMatrix.NoComputedData;

            this.arincLandingElevation.setBnrValue(landingElevation ? landingElevation : 0, ssm, 14, 16384, -2048);
        }

        if (this.destinationLatitude !== latitude) {
            this.destinationLatitude = latitude;

            const ssm = latitude !== undefined ? Arinc429Word.SignStatusMatrix.NormalOperation : Arinc429Word.SignStatusMatrix.NoComputedData;

            this.arincDestinationLatitude.setBnrValue(latitude ? latitude : 0, ssm, 18, 180, -180);
        }

        if (this.destinationLongitude !== longitude) {
            this.destinationLongitude = longitude;

            const ssm = longitude !== undefined ? Arinc429Word.SignStatusMatrix.NormalOperation : Arinc429Word.SignStatusMatrix.NoComputedData;

            this.arincDestinationLongitude.setBnrValue(longitude ? longitude : 0, ssm, 18, 180, -180);
        }
    }

    updateMinimums() {
        const inRange = this.shouldTransmitMinimums();

        const mdaValid = inRange && this.perfApprMDA !== null;
        const dhValid = !mdaValid && inRange && typeof this.perfApprDH === 'number';

        const mdaSsm = mdaValid ? Arinc429Word.SignStatusMatrix.NormalOperation : Arinc429Word.SignStatusMatrix.NoComputedData;
        const dhSsm = dhValid ? Arinc429Word.SignStatusMatrix.NormalOperation : Arinc429Word.SignStatusMatrix.NoComputedData;

        this.arincMDA.setBnrValue(mdaValid ? this.perfApprMDA : 0, mdaSsm, 17, 131072, 0);
        this.arincDH.setBnrValue(dhValid ? this.perfApprDH : 0, dhSsm, 16, 8192, 0);
        this.arincEisWord2.setBitValue(29, inRange && this.perfApprDH === "NO DH");
        // FIXME we need to handle these better
        this.arincEisWord2.ssm = Arinc429Word.SignStatusMatrix.NormalOperation;
    }

    shouldTransmitMinimums() {
        const phase = this.flightPhaseManager.phase;
        const distanceToDestination = this.getDistanceToDestination();
        const isCloseToDestination = Number.isFinite(distanceToDestination) ? distanceToDestination < 250 : true;

        return (phase > FmgcFlightPhases.CRUISE || (phase === FmgcFlightPhases.CRUISE && isCloseToDestination));
    }

    getClbManagedSpeedFromCostIndex() {
        const dCI = ((this.costIndex ? this.costIndex : 0) / 999) ** 2;
        return 290 * (1 - dCI) + 330 * dCI;
    }

    getCrzManagedSpeedFromCostIndex() {
        const dCI = ((this.costIndex ? this.costIndex : 0) / 999) ** 2;
        return 290 * (1 - dCI) + 310 * dCI;
    }

    getDesManagedSpeedFromCostIndex() {
        const dCI = (this.costIndex ? this.costIndex : 0) / 999;
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

        this._onModeSelectedHeading();
        this._onModeSelectedAltitude();

        SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);

        this.taxiFuelWeight = 0.2;
        CDUInitPage.updateTowIfNeeded(this);
    }

    onEvent(_event) {
        if (_event === "MODE_SELECTED_HEADING") {
            if (Simplane.getAutoPilotHeadingManaged()) {
                if (SimVar.GetSimVarValue("L:A320_FCU_SHOW_SELECTED_HEADING", "number") === 0) {
                    const currentHeading = Simplane.getHeadingMagnetic();

                    Coherent.call("HEADING_BUG_SET", 1, currentHeading).catch(console.error);
                }
            }
            this._onModeSelectedHeading();
        }
        if (_event === "MODE_MANAGED_HEADING") {
            if (this.flightPlanService.active.legCount === 0) {
                return;
            }

            this._onModeManagedHeading();
        }
        if (_event === "MODE_SELECTED_ALTITUDE") {
            const dist = Number.isFinite(this.getDistanceToDestination()) ? this.getDistanceToDestination() : -1;
            this.flightPhaseManager.handleFcuAltKnobPushPull(dist);
            this._onModeSelectedAltitude();
            this._onStepClimbDescent();
        }
        if (_event === "MODE_MANAGED_ALTITUDE") {
            const dist = Number.isFinite(this.getDistanceToDestination()) ? this.getDistanceToDestination() : -1;
            this.flightPhaseManager.handleFcuAltKnobPushPull(dist);
            this._onModeManagedAltitude();
            this._onStepClimbDescent();
        }
        if (_event === "AP_DEC_ALT" || _event === "AP_INC_ALT") {
            const dist = Number.isFinite(this.getDistanceToDestination()) ? this.getDistanceToDestination() : -1;
            this.flightPhaseManager.handleFcuAltKnobTurn(dist);
            this._onTrySetCruiseFlightLevel();
        }
        if (_event === "AP_DEC_HEADING" || _event === "AP_INC_HEADING") {
            if (SimVar.GetSimVarValue("L:A320_FCU_SHOW_SELECTED_HEADING", "number") === 0) {
                const currentHeading = Simplane.getHeadingMagnetic();
                Coherent.call("HEADING_BUG_SET", 1, currentHeading).catch(console.error);
            }
            SimVar.SetSimVarValue("L:A320_FCU_SHOW_SELECTED_HEADING", "number", 1);
        }
        if (_event === "VS") {
            const dist = Number.isFinite(this.getDistanceToDestination()) ? this.getDistanceToDestination() : -1;
            this.flightPhaseManager.handleFcuVSKnob(dist, this._onStepClimbDescent.bind(this));
        }
    }

    _onModeSelectedHeading() {
        if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "boolean")) {
            return;
        }
        if (!SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean")) {
            SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "Number", 1);
        }
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
    }

    _onModeManagedHeading() {
        if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "boolean")) {
            return;
        }
        if (!SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean")) {
            SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "Number", 1);
        }
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 2);
        SimVar.SetSimVarValue("L:A320_FCU_SHOW_SELECTED_HEADING", "number", 0);
    }

    _onModeSelectedAltitude() {
        if (!Simplane.getAutoPilotGlideslopeHold()) {
            SimVar.SetSimVarValue("L:A320_NEO_FCU_FORCE_IDLE_VS", "Number", 1);
        }
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 1, Simplane.getAutoPilotDisplayedAltitudeLockValue(), this._forceNextAltitudeUpdate).catch(console.error);
    }

    _onModeManagedAltitude() {
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 1, Simplane.getAutoPilotDisplayedAltitudeLockValue(), this._forceNextAltitudeUpdate).catch(console.error);
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, Simplane.getAutoPilotDisplayedAltitudeLockValue(), this._forceNextAltitudeUpdate).catch(console.error);
        if (!Simplane.getAutoPilotGlideslopeHold()) {
            this.requestCall(() => {
                SimVar.SetSimVarValue("L:A320_NEO_FCU_FORCE_IDLE_VS", "Number", 1);
            });
        }
    }

    _onStepClimbDescent() {
        if (!(this.flightPhaseManager.phase === FmgcFlightPhases.CLIMB || this.flightPhaseManager.phase === FmgcFlightPhases.CRUISE)) {
            return;
        }

        const _targetFl = Simplane.getAutoPilotDisplayedAltitudeLockValue() / 100;

        if (
            (this.flightPhaseManager.phase === FmgcFlightPhases.CLIMB && _targetFl > this.cruiseLevel) ||
            (this.flightPhaseManager.phase === FmgcFlightPhases.CRUISE && _targetFl !== this.cruiseLevel)
        ) {
            this.deleteOutdatedCruiseSteps(this.cruiseLevel, _targetFl);
            this.addMessageToQueue(NXSystemMessages.newCrzAlt.getModifiedMessage(_targetFl * 100));

            this.cruiseLevel = _targetFl;
        }
    }

    deleteOutdatedCruiseSteps(oldCruiseLevel, newCruiseLevel) {
        const isClimbVsDescent = newCruiseLevel > oldCruiseLevel;

        const activePlan = this.flightPlanService.active;

        for (let i = activePlan.activeLegIndex; i < activePlan.legCount; i++) {
            const element = activePlan.elementAt(i);

            if (!element || element.isDiscontinuity === true || !element.cruiseStep) {
                continue;
            }

            const stepLevel = Math.round(element.cruiseStep.toAltitude / 100);

            if (isClimbVsDescent && stepLevel >= oldCruiseLevel && stepLevel <= newCruiseLevel ||
                    !isClimbVsDescent && stepLevel <= oldCruiseLevel && stepLevel >= newCruiseLevel
            ) {
                element.cruiseStep = undefined; // TODO call a method on FPS so that we sync this (fms-v2)
                this.removeMessageFromQueue(NXSystemMessages.stepAhead.text);
            }
        }
    }

    /***
     * Executed on every alt knob turn, checks whether or not the crz fl can be changed to the newly selected fcu altitude
     * It creates a timeout to simulate real life delay which resets every time the fcu knob alt increases or decreases.
     * @private
     */
    _onTrySetCruiseFlightLevel() {
        if (!(this.flightPhaseManager.phase === FmgcFlightPhases.CLIMB || this.flightPhaseManager.phase === FmgcFlightPhases.CRUISE)) {
            return;
        }

        const activeVerticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'enum');

        if ((activeVerticalMode >= 11 && activeVerticalMode <= 15) || (activeVerticalMode >= 21 && activeVerticalMode <= 23)) {
            const fcuFl = Simplane.getAutoPilotDisplayedAltitudeLockValue() / 100;

            if (this.flightPhaseManager.phase === FmgcFlightPhases.CLIMB && fcuFl > this.cruiseLevel ||
                this.flightPhaseManager.phase === FmgcFlightPhases.CRUISE && fcuFl !== this.cruiseLevel
            ) {
                if (this.cruiseFlightLevelTimeOut) {
                    clearTimeout(this.cruiseFlightLevelTimeOut);
                    this.cruiseFlightLevelTimeOut = undefined;
                }

                this.cruiseFlightLevelTimeOut = setTimeout(() => {
                    if (fcuFl === Simplane.getAutoPilotDisplayedAltitudeLockValue() / 100 &&
                        (
                            this.flightPhaseManager.phase === FmgcFlightPhases.CLIMB && fcuFl > this.cruiseLevel ||
                            this.flightPhaseManager.phase === FmgcFlightPhases.CRUISE && fcuFl !== this.cruiseLevel
                        )
                    ) {
                        this.addMessageToQueue(NXSystemMessages.newCrzAlt.getModifiedMessage(fcuFl * 100));
                        this.cruiseLevel = fcuFl;

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

    checkGWParams() {
        const fmGW = SimVar.GetSimVarValue("L:A32NX_FM_GROSS_WEIGHT", "Number");
        const eng1state = SimVar.GetSimVarValue("L:A32NX_ENGINE_STATE:1", "Number");
        const eng2state = SimVar.GetSimVarValue("L:A32NX_ENGINE_STATE:2", "Number");
        const gs = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
        const actualGrossWeight = SimVar.GetSimVarValue("TOTAL WEIGHT", "Kilograms") / 1000; //TO-DO Source to be replaced with FAC-GW
        const gwMismatch = (Math.abs(fmGW - actualGrossWeight) > 7) ? true : false;

        if (eng1state == 2 || eng2state == 2) {
            if (this._gwInitDisplayed < 1 && this.flightPhaseManager.phase < FmgcFlightPhases.TAKEOFF) {
                this._initMessageSettable = true;
            }
        }
        //INITIALIZE WEIGHT/CG
        if (this.isAnEngineOn() && fmGW === 0 && this._initMessageSettable) {
            this.addMessageToQueue(NXSystemMessages.initializeWeightOrCg);
            this._gwInitDisplayed++;
            this._initMessageSettable = false;
        }

        //CHECK WEIGHT
        //TO-DO Ground Speed used for redundancy and to simulate delay (~10s) for FAC parameters to be calculated, remove once FAC is available.
        if (!this.isOnGround() && gwMismatch && this._checkWeightSettable && gs > 180) {
            this.addMessageToQueue(NXSystemMessages.checkWeight);
            this._checkWeightSettable = false;
        } else if (!gwMismatch) {
            this.removeMessageFromQueue(NXSystemMessages.checkWeight.text);
            this._checkWeightSettable = true;
        }
    }

    /* END OF FMS CHECK ROUTINE */
    /* MCDU GET/SET METHODS */

    setCruiseFlightLevelAndTemperature(input) {
        if (input === FMCMainDisplay.clrValue) {
            this.cruiseLevel = null;
            this.cruiseTemperature = undefined;
            return true;
        }
        const flString = input.split("/")[0].replace("FL", "");
        const tempString = input.split("/")[1];
        const onlyTemp = flString.length === 0;

        if (!!flString && !onlyTemp && this.trySetCruiseFl(parseFloat(flString))) {
            if (SimVar.GetSimVarValue("L:A32NX_CRZ_ALT_SET_INITIAL", "bool") === 1 && SimVar.GetSimVarValue("L:A32NX_GOAROUND_PASSED", "bool") === 1) {
                SimVar.SetSimVarValue("L:A32NX_NEW_CRZ_ALT", "number", this.cruiseLevel);
            } else {
                SimVar.SetSimVarValue("L:A32NX_CRZ_ALT_SET_INITIAL", "bool", 1);
            }
            if (!tempString) {
                return true;
            }
        }
        if (!!tempString) {
            const temp = parseInt(tempString.replace("M", "-"));
            console.log("tS: " + tempString);
            console.log("ti: " + temp);
            if (isFinite(temp) && this.cruiseLevel) {
                if (temp > -270 && temp < 100) {
                    this.cruiseTemperature = temp;
                    return true;
                } else {
                    this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                    return false;
                }
            } else {
                this.setScratchpadMessage(NXSystemMessages.notAllowed);
                return false;
            }
        }
        this.setScratchpadMessage(NXSystemMessages.formatError);
        return false;
    }

    tryUpdateCostIndex(costIndex) {
        const value = parseInt(costIndex);
        if (isFinite(value)) {
            if (value >= 0) {
                if (value < 1000) {
                    this.costIndex = value;
                    this.updateManagedSpeeds();
                    return true;
                } else {
                    this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                    return false;
                }
            }
        }
        this.setScratchpadMessage(NXSystemMessages.notAllowed);
        return false;
    }

    /**
     * Any tropopause altitude up to 60,000 ft is able to be entered
     * @param {string} tropo Format: NNNN or NNNNN Leading 0’s must be included. Entry is rounded to the nearest 10 ft
     * @return {boolean} Whether tropopause could be set or not
     */
    tryUpdateTropo(tropo) {
        if (tropo === FMCMainDisplay.clrValue) {
            if (this.tropo) {
                this.tropo = undefined;
                return true;
            }
            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return false;
        }

        if (!tropo.match(/^(?=(\D*\d){4,5}\D*$)/g)) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }

        const value = parseInt(tropo);
        if (isFinite(value) && value >= 0 && value <= 60000) {
            this.tropo = Math.round(value / 10) * 10;
            return true;
        }

        this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        return false;
    }

    //-----------------------------------------------------------------------------------
    // TODO:FPM REWRITE: Start of functions to refactor
    //-----------------------------------------------------------------------------------

    resetCoroute() {
        this.coRoute.routeNumber = undefined;
        this.coRoute.routes = [];
    }

    /** MCDU Init page method for FROM/TO, NOT for programmatic use */
    tryUpdateFromTo(fromTo, callback = EmptyCallback.Boolean) {
        if (fromTo === FMCMainDisplay.clrValue) {
            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return callback(false);
        }

        const match = fromTo.match(/^([A-Z]{4})\/([A-Z]{4})$/);
        if (match === null) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return callback(false);
        }
        const [, from, to] = match;

        this.resetCoroute();

        this.setFromTo(from, to).then(() => {
            this.getCoRouteList().then(() => callback(true)).catch(console.log);
        }).catch((e) => {
            if (e instanceof McduMessage) {
                this.setScratchpadMessage(e);
            } else {
                console.warn(e);
            }
            callback(false);
        });
    }

    /**
     * Programmatic method to set from/to
     * @param {string} from 4-letter icao code for origin airport
     * @param {string} to 4-letter icao code for destination airport
     * @throws NXSystemMessage on error (you are responsible for pushing to the scratchpad if appropriate)
     */
    async setFromTo(from, to) {
        let airportFrom, airportTo;
        try {
            airportFrom = await this.navigationDatabaseService.activeDatabase.searchAirport(from);
            airportTo = await this.navigationDatabaseService.activeDatabase.searchAirport(to);

            if (!airportFrom || !airportTo) {
                throw NXSystemMessages.notInDatabase;
            }
        } catch (e) {
            console.log(e);
            throw NXSystemMessages.notInDatabase;
        }

        this.atsu.resetAtisAutoUpdate();

        return this.flightPlanService.newCityPair(from, to).then(() => {
            this.setGroundTempFromOrigin();
        });
    }

    /**
     * Computes distance between destination and alternate destination
     */
    tryUpdateDistanceToAlt() {
        const activePlan = this.flightPlanService.active;

        if (activePlan && activePlan.destinationAirport && activePlan.alternateDestinationAirport) {
            this._DistanceToAlt = Avionics.Utils.computeGreatCircleDistance(
                activePlan.destinationAirport.location,
                activePlan.alternateDestinationAirport.location,
            );
        } else {
            this._DistanceToAlt = 0;
        }
    }

    //-----------------------------------------------------------------------------------
    // TODO:FPM REWRITE: End of functions to refactor
    //-----------------------------------------------------------------------------------

    // only used by trySetRouteAlternateFuel
    isAltFuelInRange(fuel) {
        if (Number.isFinite(this.blockFuel)) {
            return 0 < fuel && fuel < (this.blockFuel - this._routeTripFuelWeight);
        }

        return 0 < fuel;
    }

    async trySetRouteAlternateFuel(altFuel) {
        if (altFuel === FMCMainDisplay.clrValue) {
            this._routeAltFuelEntered = false;
            return true;
        }
        if (!this.flightPlanService || !this.flightPlanService.active || !this.flightPlanService.active.alternateDestinationAirport) {
            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return false;
        }

        const value = NXUnits.userToKg(parseFloat(altFuel));
        if (isFinite(value)) {
            if (this.isAltFuelInRange(value)) {
                this._routeAltFuelEntered = true;
                this._routeAltFuelWeight = value;
                this._routeAltFuelTime = null;
                return true;
            } else {
                this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                return false;
            }
        }
        this.setScratchpadMessage(NXSystemMessages.formatError);
        return false;
    }

    async trySetMinDestFob(fuel) {
        if (fuel === FMCMainDisplay.clrValue) {
            this._minDestFobEntered = false;
            return true;
        }
        if (!this.representsDecimalNumber(fuel)) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }

        const value = NXUnits.userToKg(parseFloat(fuel));
        if (isFinite(value)) {
            if (this.isMinDestFobInRange(value)) {
                this._minDestFobEntered = true;
                if (value < this._routeAltFuelWeight + this.getRouteFinalFuelWeight()) {
                    this.addMessageToQueue(NXSystemMessages.checkMinDestFob);
                }
                this._minDestFob = value;
                return true;
            } else {
                this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                return false;
            }
        }
        this.setScratchpadMessage(NXSystemMessages.formatError);
        return false;
    }

    async tryUpdateAltDestination(altDestIdent) {
        if (!altDestIdent || altDestIdent === "NONE" || altDestIdent === FMCMainDisplay.clrValue) {
            this.atsu.resetAtisAutoUpdate();
            this.flightPlanService.setAlternate(undefined);
            this._DistanceToAlt = 0;
            return true;
        }

        const airportAltDest = await this.navigationDatabaseService.activeDatabase.searchAirport(altDestIdent);
        if (airportAltDest) {
            this.atsu.resetAtisAutoUpdate();
            await this.flightPlanService.setAlternate(altDestIdent);
            this.tryUpdateDistanceToAlt();
            return true;
        }

        this.setScratchpadMessage(NXSystemMessages.notInDatabase);
        return false;
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
            const airDistance = A32NX_FuelPred.computeAirDistance(Math.round(this._DistanceToAlt), this.averageWind);

            const deviation = (this.zeroFuelWeight + this._routeFinalFuelWeight - A32NX_FuelPred.refWeight) * A32NX_FuelPred.computeNumbers(airDistance, placeholderFl, A32NX_FuelPred.computations.CORRECTIONS, true);
            if ((20 < airDistance && airDistance < 200) && (100 < placeholderFl && placeholderFl < 290)) { //This will always be true until we can setup alternate routes
                this._routeAltFuelWeight = (A32NX_FuelPred.computeNumbers(airDistance, placeholderFl, A32NX_FuelPred.computations.FUEL, true) + deviation) / 1000;
                this._routeAltFuelTime = this._routeAltFuelEntered ? null : A32NX_FuelPred.computeNumbers(airDistance, placeholderFl, A32NX_FuelPred.computations.TIME, true);
            }
        }
    }

    /**
     * Attempts to calculate trip information. Is dynamic in that it will use liveDistanceTo the destination rather than a
     * static distance. Works down to 20NM airDistance and FL100 Up to 3100NM airDistance and FL390, anything out of those ranges and values
     * won't be updated.
     */
    tryUpdateRouteTrip(dynamic = false) {
        // TODO Use static distance for `dynamic = false` (fms-v2)
        const groundDistance = Number.isFinite(this.getDistanceToDestination()) ? this.getDistanceToDestination() : -1;
        const airDistance = A32NX_FuelPred.computeAirDistance(groundDistance, this.averageWind);

        let altToUse = this.cruiseLevel;
        // Use the cruise level for calculations otherwise after cruise use descent altitude down to 10,000 feet.
        if (this.flightPhaseManager.phase >= FmgcFlightPhases.DESCENT) {
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
        if (useFOB) {
            return this.getFOB() - this.getTotalTripFuelCons() - this._minDestFob - this.taxiFuelWeight - (this.getRouteReservedWeight());
        } else {
            return this.blockFuel - this.getTotalTripFuelCons() - this._minDestFob - this.taxiFuelWeight - (this.getRouteReservedWeight());
        }
    }

    /**getRouteReservedWeight
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

    //-----------------------------------------------------------------------------------
    // TODO:FPM REWRITE: Start of functions to refactor
    //-----------------------------------------------------------------------------------

    // FIXME remove A32NX_FM_LS_COURSE
    async updateIlsCourse() {
        let course = -1;
        const mmr = this.navigation.getNavaidTuner().getMmrRadioTuningStatus(1);
        if (mmr.course !== null) {
            course = mmr.course;
        } else if (mmr.frequency !== null && SimVar.GetSimVarValue('L:A32NX_RADIO_RECEIVER_LOC_IS_VALID', 'number') === 1) {
            course = SimVar.GetSimVarValue('NAV LOCALIZER:3', 'degrees');
        }

        return SimVar.SetSimVarValue('L:A32NX_FM_LS_COURSE', 'number', course);
    }

    async updateFlightNo(flightNo, callback = EmptyCallback.Boolean) {
        if (flightNo.length > 7) {
            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return callback(false);
        }

        this.flightNumber = flightNo;
        await SimVar.SetSimVarValue("ATC FLIGHT NUMBER", "string", flightNo, "FMC");

        // FIXME move ATSU code to ATSU
        const code = await this.atsu.connectToNetworks(flightNo);
        if (code !== AtsuCommon.AtsuStatusCodes.Ok) {
            this.addNewAtsuMessage(code);
        }

        return callback(true);
    }

    async updateCoRoute(coRouteNum, callback = EmptyCallback.Boolean) {
        try {
            if (coRouteNum.length > 2 && (coRouteNum !== FMCMainDisplay.clrValue)) {
                if (coRouteNum.length < 10) {
                    if (coRouteNum === "NONE") {
                        this.resetCoroute();
                    } else {
                        const {success, data} = await SimBridgeClient.CompanyRoute.getCoRoute(coRouteNum);
                        if (success) {
                            this.coRoute["originIcao"] = data.origin.icao_code;
                            this.coRoute["destinationIcao"] = data.destination.icao_code;
                            this.coRoute["route"] = data.general.route;
                            if (data.alternate) {
                                this.coRoute["alternateIcao"] = data.alternate.icao_code;
                            }
                            this.coRoute["navlog"] = data.navlog.fix;

                            await Fmgc.CoRouteUplinkAdapter.uplinkFlightPlanFromCoRoute(this, this.flightPlanService, this.coRoute);
                            await this.flightPlanService.uplinkInsert();
                            this.setGroundTempFromOrigin();

                            this.coRoute["routeNumber"] = coRouteNum;
                        } else {
                            this.setScratchpadMessage(NXSystemMessages.notInDatabase);
                        }
                    }
                    return callback(true);
                }
            }
            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return callback(false);
        } catch (error) {
            console.error(`Error retrieving coroute from SimBridge ${error}`);
            this.setScratchpadMessage(NXFictionalMessages.unknownDownlinkErr);
            return callback(false);
        }
    }

    async getCoRouteList() {
        try {
            const origin = this.flightPlanService.active.originAirport.ident;
            const dest = this.flightPlanService.active.destinationAirport.ident;
            const { success, data } = await SimBridgeClient.CompanyRoute.getRouteList(origin, dest);

            if (success) {
                data.forEach((route => {
                    this.coRoute.routes.push({
                        originIcao: route.origin.icao_code,
                        destinationIcao: route.destination.icao_code,
                        alternateIcao: route.alternate ? route.alternate.icao_code : undefined,
                        route: route.general.route,
                        navlog: route.navlog.fix,
                        routeName: route.name
                    });
                }));
            } else {
                this.setScratchpadMessage(NXSystemMessages.notInDatabase);
            }
        } catch (error) {
            console.info(`Error retrieving coroute list ${error}`);
        }
    }

    getTotalTripTime() {
        return this._routeTripTime;
    }

    getTotalTripFuelCons() {
        return this._routeTripFuelWeight;
    }

    onUplinkInProgress() {
        this.setScratchpadMessage(NXSystemMessages.uplinkInsertInProg);
    }

    onUplinkDone() {
        this.removeMessageFromQueue(NXSystemMessages.uplinkInsertInProg.text);
        this.setScratchpadMessage(NXSystemMessages.aocActFplnUplink);
    }

    /**
     @param items {Array.<import('msfs-navdata').DatabaseItem>}
     */
    deduplicateFacilities(items) {
        if (items.length === 0) {
            return undefined;
        }
        if (items.length === 1) {
            return items[0];
        }

        return new Promise((resolve) => {
            A320_Neo_CDU_SelectWptPage.ShowPage(this, items, resolve);
        });
    }

    /**
     * Shows a scratchpad message based on the FMS error thrown
     * @param type
     */
    showFmsErrorMessage(type) {
        switch (type) {
            case 0: // NotInDatabase
                this.setScratchpadMessage(NXSystemMessages.notInDatabase);
                break;
            case 1: // NotYetImplemented
                this.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
                break;
            case 2: // FormatError
                this.setScratchpadMessage(NXSystemMessages.formatError);
                break;
            case 3: // EntryOutOfRange
                this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                break;
            case 4: // ListOf99InUse
                this.setScratchpadMessage(NXSystemMessages.listOf99InUse);
                break;
            case 5: // AwyWptMismatch
                this.setScratchpadMessage(NXSystemMessages.awyWptMismatch);
                break;
        }
    }

    createNewWaypoint(ident) {
        return new Promise((resolve, reject) => {
            CDUNewWaypoint.ShowPage(this, (waypoint) => {
                if (waypoint) {
                    resolve(waypoint);
                } else {
                    reject();
                }
            }, { ident });
        });

    }

    createLatLonWaypoint(coordinates, stored, ident = undefined) {
        return this.dataManager.createLatLonWaypoint(coordinates, stored, ident);
    }

    createPlaceBearingPlaceBearingWaypoint(place1, bearing1, place2, bearing2, stored, ident = undefined) {
        return this.dataManager.createPlaceBearingPlaceBearingWaypoint(place1, bearing1, place2, bearing2, stored, ident);
    }

    createPlaceBearingDistWaypoint(place, bearing, distance, stored, ident = undefined) {
        return this.dataManager.createPlaceBearingDistWaypoint(place, bearing, distance, stored, ident);
    }

    getStoredWaypointsByIdent(ident) {
        return this.dataManager.getStoredWaypointsByIdent(ident);
    }

    //-----------------------------------------------------------------------------------
    // TODO:FPM REWRITE: Start of functions to refactor
    //-----------------------------------------------------------------------------------

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

    getOrSelectILSsByIdent(ident, callback) {
        this._getOrSelectWaypoints(this.navigationDatabase.searchIls.bind(this.navigationDatabase), ident, callback);
    }

    getOrSelectVORsByIdent(ident, callback) {
        this._getOrSelectWaypoints(this.navigationDatabase.searchVor.bind(this.navigationDatabase), ident, callback);
    }

    getOrSelectNDBsByIdent(ident, callback) {
        this._getOrSelectWaypoints(this.navigationDatabase.searchNdb.bind(this.navigationDatabase), ident, callback);
    }

    getOrSelectNavaidsByIdent(ident, callback) {
        this._getOrSelectWaypoints(this.navigationDatabase.searchAllNavaid.bind(this.navigationDatabase), ident, callback);
    }

    /**
     * This function only finds waypoints, not navaids. Some fixes may exist as a VOR and a waypoint in the database, this will only return the waypoint.
     * Use @see Fmgc.WaypointEntryUtils.getOrCreateWaypoint instead if you don't want that
     * @param {*} ident
     * @param {*} callback
     */
    getOrSelectWaypointByIdent(ident, callback) {
        this._getOrSelectWaypoints(this.navigationDatabase.searchWaypoint.bind(this.navigationDatabase), ident, callback);
    }

    insertWaypoint(newWaypointTo, fpIndex, forAlternate, index, before = false, callback = EmptyCallback.Boolean, bypassTmpy) {
        if (newWaypointTo === "" || newWaypointTo === FMCMainDisplay.clrValue) {
            return callback(false);
        }
        try {
            Fmgc.WaypointEntryUtils.getOrCreateWaypoint(this, newWaypointTo, true).then(
                /**
                 * @param {Waypoint} waypoint
                 */
                (waypoint) => {
                    if (!waypoint) {
                        return callback(false);
                    }
                    if (bypassTmpy) {
                        if (fpIndex === Fmgc.FlightPlanIndex.Active && this.flightPlanService.hasTemporary) {
                            this.setScratchpadMessage(NXSystemMessages.notAllowed);
                            return callback(false);
                        }

                        if (before) {
                            this.flightPlanService.insertWaypointBefore(index, waypoint, fpIndex, forAlternate).then(() => callback(true));
                        } else {
                            this.flightPlanService.nextWaypoint(index, waypoint, fpIndex, forAlternate).then(() => callback(true));
                        }
                    } else {
                        if (before) {
                            this.flightPlanService.insertWaypointBefore(index, waypoint, fpIndex, forAlternate).then(() => callback(true));
                        } else {
                            this.flightPlanService.nextWaypoint(index, waypoint, fpIndex, forAlternate).then(() => callback(true));
                        }
                    }
                }).catch((err) => {
                if (err.type !== undefined) {
                    this.showFmsErrorMessage(err.type);
                } else if (err instanceof McduMessage) {
                    this.setScratchpadMessage(err);
                } else if (err) {
                    console.error(err);
                }
                return callback(false);
            }
            );
        } catch (err) {
            if (err.type !== undefined) {
                this.showFmsErrorMessage(err.type);
            } else if (err instanceof McduMessage) {
                this.setScratchpadMessage(err);
            } else {
                console.error(err);
            }
            return callback(false);
        }
    }

    toggleWaypointOverfly(index, fpIndex, forAlternate, callback = EmptyCallback.Void) {
        if (this.flightPlanService.hasTemporary) {
            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return callback(false);
        }

        this.flightPlanService.toggleOverfly(index, fpIndex, forAlternate);
        callback();
    }

    eraseTemporaryFlightPlan(callback = EmptyCallback.Void) {
        if (this.flightPlanService.hasTemporary) {
            this.flightPlanService.temporaryDelete();

            SimVar.SetSimVarValue("L:FMC_FLIGHT_PLAN_IS_TEMPORARY", "number", 0);
            SimVar.SetSimVarValue("L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN", "number", 0);
            callback();
        } else {
            callback();
        }
    }

    insertTemporaryFlightPlan(callback = EmptyCallback.Void) {
        if (this.flightPlanService.hasTemporary) {
            const oldCostIndex = this.costIndex;
            const oldDestination = this.currFlightPlanService.active.destinationAirport
                ? this.currFlightPlanService.active.destinationAirport.ident
                : undefined;
            const oldCruiseLevel = this.cruiseLevel;
            this.flightPlanService.temporaryInsert();
            this.checkCostIndex(oldCostIndex);
            // FIXME I don't know if it is actually possible to insert TMPY with no FROM/TO, but we should not crash here, so check this for now
            if (oldDestination !== undefined) {
                this.checkDestination(oldDestination);
            }
            this.checkCruiseLevel(oldCruiseLevel);

            SimVar.SetSimVarValue("L:FMC_FLIGHT_PLAN_IS_TEMPORARY", "number", 0);
            SimVar.SetSimVarValue("L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN", "number", 0);

            this.guidanceController.vnavDriver.invalidateFlightPlanProfile();
            callback();
        }
    }

    checkCostIndex(oldCostIndex) {
        if (this.costIndex !== oldCostIndex) {
            this.setScratchpadMessage(NXSystemMessages.usingCostIndex.getModifiedMessage(this.costIndex.toFixed(0)));
        }
    }

    checkDestination(oldDestination) {
        const newDestination = this.currFlightPlanService.active.destinationAirport.ident;

        // Enabling alternate or new DEST should sequence out of the GO AROUND phase
        if (newDestination !== oldDestination) {
            this.flightPhaseManager.handleNewDestinationAirportEntered();
        }
    }

    checkCruiseLevel(oldCruiseLevel) {
        const newLevel = this.cruiseLevel;
        // Keep simvar in sync for the flight phase manager
        if (newLevel !== oldCruiseLevel) {
            SimVar.SetSimVarValue('L:A32NX_AIRLINER_CRUISE_ALTITUDE', 'number', Number.isFinite(newLevel * 100) ? newLevel * 100 : 0);
        }
    }

    //-----------------------------------------------------------------------------------
    // TODO:FPM REWRITE: End of functions to refactor
    //-----------------------------------------------------------------------------------

    /*
     * validates the waypoint type
     * return values:
     *    0 = lat-lon coordinate
     *    1 = time
     *    2 = place definition
     *   -1 = unknown
     */
    async waypointType(mcdu, waypoint) {
        if (Fmgc.WaypointEntryUtils.isLatLonFormat(waypoint)) {
            return [0, null];
        }

        // time formatted
        if (/([0-2][0-4][0-5][0-9]Z?)/.test(waypoint) && waypoint.length <= 5) {
            return [1, null];
        }

        // place formatted
        if (/^[A-Z0-9]{2,7}/.test(waypoint)) {
            return mcdu.dataManager.GetWaypointsByIdent.bind(mcdu.dataManager)(waypoint).then((waypoints) => {
                if (waypoints.length !== 0) {
                    return [2, null];
                } else {
                    return [-1, NXSystemMessages.notInDatabase];
                }
            });
        }

        return [-1, NXSystemMessages.formatError];
    }

    vSpeedsValid() {
        return (!!this.v1Speed && !!this.vRSpeed ? this.v1Speed <= this.vRSpeed : true)
            && (!!this.vRSpeed && !!this.v2Speed ? this.vRSpeed <= this.v2Speed : true)
            && (!!this.v1Speed && !!this.v2Speed ? this.v1Speed <= this.v2Speed : true);
    }

    /**
     * Gets the departure runway elevation in feet, if available.
     * @returns departure runway elevation in feet, or null if not available.
     */
    getDepartureElevation() {
        const activePlan = this.flightPlanService.active;

        let departureElevation = null;
        if (activePlan.originRunway) {
            departureElevation = activePlan.originRunway.thresholdLocation.alt;
        } else if (activePlan.originAirport) {
            departureElevation = activePlan.originAirport.location.alt;
        }

        return departureElevation;
    }

    /**
     * Gets the gross weight, if available.
     * Prior to engine start this is based on ZFW + Fuel entries,
     * after engine start ZFW entry + FQI FoB.
     * @returns {number | null} gross weight in tons or null if not available.
     */
    getGrossWeight() {
        const fob = this.getFOB();

        if (this.zeroFuelWeight === undefined || fob === undefined) {
            return null;
        }

        return this.zeroFuelWeight + fob;
    }

    getToSpeedsTooLow() {
        const grossWeight = this.getGrossWeight();

        if (this.flaps === null || grossWeight === null) {
            return false;
        }

        const departureElevation = this.getDepartureElevation();

        const zp = departureElevation !== null ? this.getPressureAltAtElevation(departureElevation, this.getBaroCorrection1()) : this.getPressureAlt();
        if (zp === null) {
            return false;
        }

        const tow = grossWeight - (this.isAnEngineOn() || this.taxiFuelWeight === undefined ? 0 : this.taxiFuelWeight);

        return ((this.v1Speed == null) ? Infinity : this.v1Speed) < Math.trunc(NXSpeedsUtils.getVmcg(zp))
            || ((this.vRSpeed == null) ? Infinity : this.vRSpeed) < Math.trunc(1.05 * NXSpeedsUtils.getVmca(zp))
            || ((this.v2Speed == null) ? Infinity : this.v2Speed) < Math.trunc(1.1 * NXSpeedsUtils.getVmca(zp))
            || (isFinite(tow) && ((this.v2Speed == null) ? Infinity : this.v2Speed) < Math.trunc(1.13 * NXSpeedsUtils.getVs1g(tow, this.flaps, true)));
    }

    toSpeedsChecks() {
        const toSpeedsNotInserted = !this.v1Speed || !this.vRSpeed || !this.v2Speed;
        if (toSpeedsNotInserted !== this.toSpeedsNotInserted) {
            this.toSpeedsNotInserted = toSpeedsNotInserted;
        }

        const toSpeedsTooLow = this.getToSpeedsTooLow();
        if (toSpeedsTooLow !== this.toSpeedsTooLow) {
            this.toSpeedsTooLow = toSpeedsTooLow;
            if (toSpeedsTooLow) {
                this.addMessageToQueue(NXSystemMessages.toSpeedTooLow, () => !this.getToSpeedsTooLow());
            }
        }

        const vSpeedDisagree = !this.vSpeedsValid();
        if (vSpeedDisagree !== this.vSpeedDisagree) {
            this.vSpeedDisagree = vSpeedDisagree;
            if (vSpeedDisagree) {
                this.addMessageToQueue(NXSystemMessages.vToDisagree, this.vSpeedsValid.bind(this));
            }
        }

        this.arincDiscreteWord3.setBitValue(16, vSpeedDisagree);
        this.arincDiscreteWord3.setBitValue(17, toSpeedsTooLow);
        this.arincDiscreteWord3.setBitValue(18, toSpeedsNotInserted);
        this.arincDiscreteWord3.ssm = Arinc429Word.SignStatusMatrix.NormalOperation;
    }

    get v1Speed() {
        return this.flightPlanService.active.performanceData.v1;
    }

    set v1Speed(speed) {
        this.flightPlanService.setPerformanceData('v1', speed);
        SimVar.SetSimVarValue('L:AIRLINER_V1_SPEED', 'knots', speed ? speed : NaN);
    }

    get vRSpeed() {
        return this.flightPlanService.active.performanceData.vr;
    }

    set vRSpeed(speed) {
        this.flightPlanService.setPerformanceData('vr', speed);
        SimVar.SetSimVarValue('L:AIRLINER_VR_SPEED', 'knots', speed ? speed : NaN);
    }

    get v2Speed() {
        return this.flightPlanService.active.performanceData.v2;
    }

    set v2Speed(speed) {
        this.flightPlanService.setPerformanceData('v2', speed);
        SimVar.SetSimVarValue('L:AIRLINER_V2_SPEED', 'knots', speed ? speed : NaN);
    }

    //Needs PR Merge #3082
    trySetV1Speed(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return false;
        }
        const v = parseInt(s);
        if (!isFinite(v) || !/^\d{2,3}$/.test(s)) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }
        if (v < 90 || v > 350) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        this.removeMessageFromQueue(NXSystemMessages.checkToData.text);
        this.unconfirmedV1Speed = undefined;
        this.v1Speed = v;
        return true;
    }

    //Needs PR Merge #3082
    trySetVRSpeed(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return false;
        }
        const v = parseInt(s);
        if (!isFinite(v) || !/^\d{2,3}$/.test(s)) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }
        if (v < 90 || v > 350) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        this.removeMessageFromQueue(NXSystemMessages.checkToData.text);
        this.unconfirmedVRSpeed = undefined;
        this.vRSpeed = v;
        return true;
    }

    //Needs PR Merge #3082
    trySetV2Speed(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return false;
        }
        const v = parseInt(s);
        if (!isFinite(v) || !/^\d{2,3}$/.test(s)) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }
        if (v < 90 || v > 350) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        this.removeMessageFromQueue(NXSystemMessages.checkToData.text);
        this.unconfirmedV2Speed = undefined;
        this.v2Speed = v;
        return true;
    }

    trySetTakeOffTransAltitude(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.flightPlanService.setPerformanceData('pilotTransitionAltitude', null);
            this.updateTransitionAltitudeLevel();
            return true;
        }

        let value = parseInt(s);
        if (!isFinite(value) || !/^\d{4,5}$/.test(s)) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }

        value = Math.round(value / 10) * 10;
        if (value < 1000 || value > 45000) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }

        this.flightPlanService.setPerformanceData('pilotTransitionAltitude', value);
        this.updateTransitionAltitudeLevel();
        return true;
    }

    /**
     * Rounds a number to the nearest multiple
     * @param {number | undefined | null} n the number to round
     * @param {number} r the multiple
     * @returns {number | undefined | null} n rounded to the nereast multiple of r, or null/undefined if n is null/undefined
     */
    static round(n, r = 1) {
        if (n === undefined || n === null) {
            return n;
        }
        return Math.round(n / r) * r;
    }

    async trySetThrustReductionAccelerationAltitude(s) {
        const plan = this.flightPlanService.active;

        if (this.flightPhaseManager.phase >= FmgcFlightPhases.TAKEOFF || !plan.originAirport) {
            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return false;
        }

        if (s === FMCMainDisplay.clrValue) {
            const hasDefaultThrRed = plan.performanceData.defaultThrustReductionAltitude !== null;
            const hasDefaultAcc = plan.performanceData.defaultAccelerationAltitude !== null;

            if (hasDefaultThrRed && hasDefaultAcc) {
                plan.setPerformanceData('pilotThrustReductionAltitude', null);
                plan.setPerformanceData('pilotAccelerationAltitude', null);
                return true;
            }

            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return false;
        }

        const match = s.match(/^(([0-9]{4,5})\/?)?(\/([0-9]{4,5}))?$/);
        if (match === null || (match[2] === undefined && match[4] === undefined) || s.split('/').length > 2) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }

        const thrRed = match[2] !== undefined ? FMCMainDisplay.round(parseInt(match[2]), 10) : null;
        const accAlt = match[4] !== undefined ? FMCMainDisplay.round(parseInt(match[4]), 10) : null;

        const origin = this.flightPlanService.active.originAirport;

        let elevation = 0;
        if (origin) {
            elevation = origin.location.alt;
        }

        const minimumAltitude = elevation + 400;

        const newThrRed = thrRed !== null ? thrRed : plan.performanceData.thrustReductionAltitude;
        const newAccAlt = accAlt !== null ? accAlt : plan.performanceData.accelerationAltitude;

        if (
            (thrRed !== null && (thrRed < minimumAltitude || thrRed > 45000))
            || (accAlt !== null && (accAlt < minimumAltitude || accAlt > 45000))
            || (newThrRed !== null && newAccAlt !== null && thrRed > accAlt)
        ) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }

        if (thrRed !== null) {
            plan.setPerformanceData('pilotThrustReductionAltitude', thrRed);
        }

        if (accAlt !== null) {
            plan.setPerformanceData('pilotAccelerationAltitude', accAlt);
        }

        return true;
    }

    async trySetEngineOutAcceleration(s) {
        const plan = this.flightPlanService.active;

        if (this.flightPhaseManager.phase >= FmgcFlightPhases.TAKEOFF || !plan.originAirport) {
            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return false;
        }

        if (s === FMCMainDisplay.clrValue) {
            const hasDefaultEngineOutAcc = plan.performanceData.defaultEngineOutAccelerationAltitude !== null;

            if (hasDefaultEngineOutAcc) {
                plan.setPerformanceData('pilotEngineOutAccelerationAltitude', null);
                return true;
            }

            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return false;
        }

        const match = s.match(/^([0-9]{4,5})$/);
        if (match === null) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }

        const accAlt = parseInt(match[1]);

        const origin = plan.originAirport;
        const elevation = origin.location.alt !== undefined ? origin.location.alt : 0;
        const minimumAltitude = elevation + 400;

        if (accAlt < minimumAltitude || accAlt > 45000) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }

        plan.setPerformanceData('pilotEngineOutAccelerationAltitude', accAlt);

        return true;
    }

    async trySetThrustReductionAccelerationAltitudeGoaround(s) {
        const plan = this.flightPlanService.active;

        if (this.flightPhaseManager.phase >= FmgcFlightPhases.GOAROUND || !plan.destinationAirport) {
            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return false;
        }

        if (s === FMCMainDisplay.clrValue) {
            const hasDefaultMissedThrRed = plan.performanceData.defaultMissedThrustReductionAltitude !== null;
            const hasDefaultMissedAcc = plan.performanceData.defaultMissedAccelerationAltitude !== null;

            if (hasDefaultMissedThrRed && hasDefaultMissedAcc) {
                plan.setPerformanceData('pilotMissedThrustReductionAltitude', null);
                plan.setPerformanceData('pilotMissedAccelerationAltitude', null);
                return true;
            }

            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return false;
        }

        const match = s.match(/^(([0-9]{4,5})\/?)?(\/([0-9]{4,5}))?$/);
        if (match === null || (match[2] === undefined && match[4] === undefined) || s.split('/').length > 2) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }

        const thrRed = match[2] !== undefined ? FMCMainDisplay.round(parseInt(match[2]), 10) : null;
        const accAlt = match[4] !== undefined ? FMCMainDisplay.round(parseInt(match[4]), 10) : null;

        const destination = plan.destinationAirport;
        const elevation = destination.location.alt !== undefined ? destination.location.alt : 0;
        const minimumAltitude = elevation + 400;

        const newThrRed = thrRed !== null ? thrRed : plan.performanceData.missedThrustReductionAltitude;
        const newAccAlt = accAlt !== null ? accAlt : plan.performanceData.missedAccelerationAltitude;

        if (
            (thrRed !== null && (thrRed < minimumAltitude || thrRed > 45000))
            || (accAlt !== null && (accAlt < minimumAltitude || accAlt > 45000))
            || (newThrRed !== null && newAccAlt !== null && thrRed > accAlt)
        ) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }

        if (thrRed !== null) {
            plan.setPerformanceData('pilotMissedThrustReductionAltitude', thrRed);
        }

        if (accAlt !== null) {
            plan.setPerformanceData('pilotMissedAccelerationAltitude', accAlt);
        }

        return true;
    }

    async trySetEngineOutAccelerationAltitudeGoaround(s) {
        const plan = this.flightPlanService.active;

        if (this.flightPhaseManager.phase >= FmgcFlightPhases.GOAROUND || !plan.destinationAirport) {
            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return false;
        }

        if (s === FMCMainDisplay.clrValue) {
            const hasDefaultMissedEOAcc = plan.performanceData.defaultMissedEngineOutAccelerationAltitude !== null;

            if (hasDefaultMissedEOAcc) {
                plan.setPerformanceData('pilotMissedEngineOutAccelerationAltitude', null);
                return true;
            }

            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return false;
        }

        const match = s.match(/^([0-9]{4,5})$/);
        if (match === null) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }

        const accAlt = parseInt(match[1]);

        const destination = plan.destinationAirport;
        const elevation = destination.location.alt !== undefined ? destination.location.alt : 0;
        const minimumAltitude = elevation + 400;

        if (accAlt < minimumAltitude || accAlt > 45000) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }

        plan.setPerformanceData('pilotMissedEngineOutAccelerationAltitude', accAlt);

        return true;
    }

    thrustReductionAccelerationChecks() {
        const activePlan = this.flightPlanService.active;

        if (activePlan.reconcileAccelerationWithConstraints()) {
            this.addMessageToQueue(NXSystemMessages.newAccAlt.getModifiedMessage(activePlan.performanceData.accelerationAltitude.toFixed(0)));
        }

        if (activePlan.reconcileThrustReductionWithConstraints()) {
            this.addMessageToQueue(NXSystemMessages.newThrRedAlt.getModifiedMessage(activePlan.performanceData.thrustReductionAltitude.toFixed(0)));
        }
    }

    updateThrustReductionAcceleration() {
        const activePerformanceData = this.flightPlanService.active.performanceData;

        this.arincThrustReductionAltitude.setBnrValue(
            activePerformanceData.thrustReductionAltitude !== null ? activePerformanceData.thrustReductionAltitude : 0,
            activePerformanceData.thrustReductionAltitude !== null ? Arinc429Word.SignStatusMatrix.NormalOperation : Arinc429Word.SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );
        this.arincAccelerationAltitude.setBnrValue(
            activePerformanceData.accelerationAltitude !== null ? activePerformanceData.accelerationAltitude : 0,
            activePerformanceData.accelerationAltitude !== null ? Arinc429Word.SignStatusMatrix.NormalOperation : Arinc429Word.SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );
        this.arincEoAccelerationAltitude.setBnrValue(
            activePerformanceData.engineOutAccelerationAltitude !== null ? activePerformanceData.engineOutAccelerationAltitude : 0,
            activePerformanceData.engineOutAccelerationAltitude !== null ? Arinc429Word.SignStatusMatrix.NormalOperation : Arinc429Word.SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );

        this.arincMissedThrustReductionAltitude.setBnrValue(
            activePerformanceData.missedThrustReductionAltitude !== null ? activePerformanceData.missedThrustReductionAltitude : 0,
            activePerformanceData.missedThrustReductionAltitude !== null ? Arinc429Word.SignStatusMatrix.NormalOperation : Arinc429Word.SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );
        this.arincMissedAccelerationAltitude.setBnrValue(
            activePerformanceData.missedAccelerationAltitude !== null ? activePerformanceData.missedAccelerationAltitude : 0,
            activePerformanceData.missedAccelerationAltitude !== null ? Arinc429Word.SignStatusMatrix.NormalOperation : Arinc429Word.SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );
        this.arincMissedEoAccelerationAltitude.setBnrValue(
            activePerformanceData.missedEngineOutAccelerationAltitude !== null ? activePerformanceData.missedEngineOutAccelerationAltitude : 0,
            activePerformanceData.missedEngineOutAccelerationAltitude !== null ? Arinc429Word.SignStatusMatrix.NormalOperation : Arinc429Word.SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );
    }

    updateTransitionAltitudeLevel() {
        const originTransitionAltitude = this.getOriginTransitionAltitude();
        this.arincTransitionAltitude.setBnrValue(
            originTransitionAltitude !== null ? originTransitionAltitude : 0,
            originTransitionAltitude !== null ? Arinc429Word.SignStatusMatrix.NormalOperation : Arinc429Word.SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );

        const destinationTansitionLevel = this.getDestinationTransitionLevel();
        this.arincTransitionLevel.setBnrValue(
            destinationTansitionLevel !== null ? destinationTansitionLevel : 0,
            destinationTansitionLevel !== null ? Arinc429Word.SignStatusMatrix.NormalOperation : Arinc429Word.SignStatusMatrix.NoComputedData,
            9, 512, 0,
        );
    }

    //Needs PR Merge #3082
    //TODO: with FADEC no longer needed
    setPerfTOFlexTemp(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.perfTOTemp = NaN;
            // In future we probably want a better way of checking this, as 0 is
            // in the valid flex temperature range (-99 to 99).
            SimVar.SetSimVarValue("L:A32NX_AIRLINER_TO_FLEX_TEMP", "Number", 0);
            return true;
        }
        let value = parseInt(s);
        if (!isFinite(value) || !/^[+\-]?\d{1,2}$/.test(s)) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }
        if (value < -99 || value > 99) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        // As the sim uses 0 as a sentinel value to detect that no flex
        // temperature is set, we'll just use 0.1 as the actual value for flex 0
        // and make sure we never display it with decimals.
        if (value === 0) {
            value = 0.1;
        }
        this.perfTOTemp = value;
        SimVar.SetSimVarValue("L:A32NX_AIRLINER_TO_FLEX_TEMP", "Number", value);
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

    trySetTaxiFuelWeight(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.taxiFuelWeight = this._defaultTaxiFuelWeight;
            this._taxiEntered = false;
            return true;
        }
        if (!this.representsDecimalNumber(s)) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }
        const value = NXUnits.userToKg(parseFloat(s));
        if (isFinite(value)) {
            if (this.isTaxiFuelInRange(value)) {
                this._taxiEntered = true;
                this.taxiFuelWeight = value;
                return true;
            } else {
                this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                return false;
            }
        }
        this.setScratchpadMessage(NXSystemMessages.notAllowed);
        return false;
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
     * @returns {boolean}
     */
    async trySetRouteFinalTime(s) {
        if (s) {
            if (s === FMCMainDisplay.clrValue) {
                this._routeFinalFuelTime = this._routeFinalFuelTimeDefault;
                this._rteFinalWeightEntered = false;
                this._rteFinalTimeEntered = false;
                return true;
            }
            // Time entry must start with '/'
            if (s.startsWith("/")) {
                const rteFinalTime = s.slice(1);

                if (!/^\d{1,4}$/.test(rteFinalTime)) {
                    this.setScratchpadMessage(NXSystemMessages.formatError);
                    return false;
                }

                if (this.isFinalTimeInRange(rteFinalTime)) {
                    this._rteFinalWeightEntered = false;
                    this._rteFinalTimeEntered = true;
                    this._routeFinalFuelTime = FMCMainDisplay.hhmmToMinutes(rteFinalTime.padStart(4,"0"));
                    return true;
                } else {
                    this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                    return false;
                }
            }
        }
        this.setScratchpadMessage(NXSystemMessages.notAllowed);
        return false;
    }

    /**
     *
     * @param {string} s
     * @returns {Promise<boolean>}
     */
    async trySetRouteFinalFuel(s) {
        if (s === FMCMainDisplay.clrValue) {
            this._routeFinalFuelTime = this._routeFinalFuelTimeDefault;
            this._rteFinalWeightEntered = false;
            this._rteFinalTimeEntered = false;
            return true;
        }
        if (s) {
            // Time entry must start with '/'
            if (s.startsWith("/")) {
                return this.trySetRouteFinalTime(s);
            } else {
                // If not time, try to parse as weight
                // Weight can be entered with optional trailing slash, if so remove it before parsing the value
                const enteredValue = s.endsWith("/") ? s.slice(0, -1) : s;

                if (!this.representsDecimalNumber(enteredValue)) {
                    this.setScratchpadMessage(NXSystemMessages.formatError);
                    return false;
                }

                const rteFinalWeight = NXUnits.userToKg(parseFloat(enteredValue));

                if (this.isFinalFuelInRange(rteFinalWeight)) {
                    this._rteFinalWeightEntered = true;
                    this._rteFinalTimeEntered = false;
                    this._routeFinalFuelWeight = rteFinalWeight;
                    this._routeFinalFuelTime = (rteFinalWeight * 1000) / this._rteFinalCoeffecient;
                    return true;
                } else {
                    this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                    return false;
                }
            }
        }
        this.setScratchpadMessage(NXSystemMessages.notAllowed);
        return false;
    }

    getRouteReservedWeight() {
        if (this.isFlying()) {
            return 0;
        }
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
        if (this.isFlying()) {
            return 0;
        }
        if (isFinite(this._routeReservedWeight) && isFinite(this.blockFuel) && this._routeReservedWeight !== 0) {
            return this._routeReservedWeight / this._routeTripFuelWeight * 100;
        }
        return this._routeReservedPercent;
    }

    trySetRouteReservedPercent(s) {
        if (!this.isFlying()) {
            if (s) {
                if (s === FMCMainDisplay.clrValue) {
                    this._rteReservedWeightEntered = false;
                    this._rteReservedPctEntered = false;
                    this._routeReservedWeight = 0;
                    this._routeReservedPercent = 5;
                    this._rteRsvPercentOOR = false;
                    return true;
                }
                // Percentage entry must start with '/'
                if (s.startsWith("/")) {
                    const enteredValue = s.slice(1);

                    if (!this.representsDecimalNumber(enteredValue)) {
                        this.setScratchpadMessage(NXSystemMessages.formatError);
                        return false;
                    }

                    const rteRsvPercent = parseFloat(enteredValue);

                    if (!this.isRteRsvPercentInRange(rteRsvPercent)) {
                        this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                        return false;
                    }

                    this._rteRsvPercentOOR = false;
                    this._rteReservedPctEntered = true;
                    this._rteReservedWeightEntered = false;

                    if (isFinite(rteRsvPercent)) {
                        this._routeReservedWeight = NaN;
                        this._routeReservedPercent = rteRsvPercent;
                        return true;
                    }
                }
            }
        }
        this.setScratchpadMessage(NXSystemMessages.notAllowed);
        return false;
    }

    /**
     * Checks input and passes to trySetCruiseFl()
     * @param input
     * @returns {boolean} input passed checks
     */
    trySetCruiseFlCheckInput(input) {
        if (input === FMCMainDisplay.clrValue) {
            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return false;
        }
        const flString = input.replace("FL", "");
        if (!flString) {
            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return false;
        }
        return this.trySetCruiseFl(parseFloat(flString));
    }

    /**
     * Sets new Cruise FL if all conditions good
     * @param fl {number} Altitude or FL
     * @returns {boolean} input passed checks
     */
    trySetCruiseFl(fl) {
        if (!isFinite(fl)) {
            this.setScratchpadMessage(NXSystemMessages.notAllowed);
            return false;
        }
        if (fl >= 1000) {
            fl = Math.floor(fl / 100);
        }
        if (fl > this.maxCruiseFL) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        const phase = this.flightPhaseManager.phase;
        const selFl = Math.floor(Math.max(0, Simplane.getAutoPilotDisplayedAltitudeLockValue("feet")) / 100);
        if (fl < selFl && (phase === FmgcFlightPhases.CLIMB || phase === FmgcFlightPhases.APPROACH || phase === FmgcFlightPhases.GOAROUND)) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }

        if (fl <= 0 || fl > this.maxCruiseFL) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }

        this.cruiseLevel = fl;
        this.onUpdateCruiseLevel(fl);

        return true;
    }

    onUpdateCruiseLevel(newCruiseLevel) {
        this._cruiseEntered = true;
        this.cruiseTemperature = undefined;
        this.updateConstraints();

        this.flightPhaseManager.handleNewCruiseAltitudeEntered(newCruiseLevel);
    }

    trySetRouteReservedFuel(s) {
        if (!this.isFlying()) {
            if (s) {
                if (s === FMCMainDisplay.clrValue) {
                    this._rteReservedWeightEntered = false;
                    this._rteReservedPctEntered = false;
                    this._routeReservedWeight = 0;
                    this._routeReservedPercent = 5;
                    this._rteRsvPercentOOR = false;
                    return true;
                }
                // Percentage entry must start with '/'
                if (s.startsWith("/")) {
                    return this.trySetRouteReservedPercent(s);
                } else {
                    // If not percentage, try to parse as weight
                    // Weight can be entered with optional trailing slash, if so remove it before parsing the value
                    const enteredValue = s.endsWith("/") ? s.slice(0, -1) : s;

                    if (!this.representsDecimalNumber(enteredValue)) {
                        this.setScratchpadMessage(NXSystemMessages.formatError);
                        return false;
                    }

                    const rteRsvWeight = NXUnits.userToKg(parseFloat(enteredValue));

                    if (!this.isRteRsvFuelInRange(rteRsvWeight)) {
                        this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                        return false;
                    }

                    this._rteReservedWeightEntered = true;
                    this._rteReservedPctEntered = false;

                    if (isFinite(rteRsvWeight)) {
                        this._routeReservedWeight = rteRsvWeight;
                        this._routeReservedPercent = 0;

                        if (!this.isRteRsvPercentInRange(this.getRouteReservedPercent())) { // Bit of a hacky method due previous tight coupling of weight and percentage calculations
                            this._rteRsvPercentOOR = true;
                        }

                        return true;
                    }
                }
            }
        }
        this.setScratchpadMessage(NXSystemMessages.notAllowed);
        return false;
    }

    trySetZeroFuelWeightZFWCG(s) {
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
                        return true;
                    }
                    this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                    return false;
                }
                if (!this._zeroFuelWeightZFWCGEntered) {
                    this.setScratchpadMessage(NXSystemMessages.notAllowed);
                    return false;
                }
                if (this.isZFWInRange(zfw)) {
                    this.zeroFuelWeight = zfw;
                    return true;
                }
                if (this.isZFWCGInRange(zfwcg)) {
                    this.zeroFuelWeightMassCenter = zfwcg;
                    return true;
                }
                this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                return false;
            }
            if (!this._zeroFuelWeightZFWCGEntered) {
                this.setScratchpadMessage(NXSystemMessages.notAllowed);
                return false;
            }
            const zfw = NXUnits.userToKg(parseFloat(s));
            if (this.isZFWInRange(zfw)) {
                this.zeroFuelWeight = zfw;
                return true;
            }
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        this.setScratchpadMessage(NXSystemMessages.formatError);
        return false;
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

    trySetBlockFuel(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.blockFuel = undefined;
            this._blockFuelEntered = false;
            this._fuelPredDone = false;
            this._fuelPlanningPhase = this._fuelPlanningPhases.PLANNING;
            return true;
        }
        const value = NXUnits.userToKg(parseFloat(s));
        if (isFinite(value) && this.isBlockFuelInRange(value)) {
            if (this.isBlockFuelInRange(value)) {
                this.blockFuel = value;
                this._blockFuelEntered = true;
                return true;
            } else {
                this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                return false;
            }
        }
        this.setScratchpadMessage(NXSystemMessages.notAllowed);
        return false;
    }

    trySetAverageWind(s) {
        const validDelims = ["TL", "T", "+", "HD", "H", "-"];
        const matchedIndex = validDelims.findIndex(element => s.startsWith(element));
        const digits = matchedIndex >= 0 ? s.replace(validDelims[matchedIndex], "") : s;
        const isNum = /^\d+$/.test(digits);
        if (!isNum) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }
        const wind = parseInt(digits);
        if (wind > 250) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        this.averageWind = matchedIndex <= 2 ? wind : -wind;
        return true;
    }

    trySetPreSelectedClimbSpeed(s) {
        const isNextPhase = this.flightPhaseManager.phase === FmgcFlightPhases.TAKEOFF;
        if (s === FMCMainDisplay.clrValue) {
            this.preSelectedClbSpeed = undefined;
            if (isNextPhase) {
                this.updatePreSelSpeedMach(undefined);
            }
            return true;
        }

        const SPD_REGEX = /\d{1,3}/;
        if (s.match(SPD_REGEX) === null) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }

        const spd = parseInt(s);
        if (!Number.isFinite(spd)) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }

        if (spd < 100 || spd > 350) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }

        this.preSelectedClbSpeed = spd;
        if (isNextPhase) {
            this.updatePreSelSpeedMach(spd);
        }

        return true;
    }

    trySetPreSelectedCruiseSpeed(s) {
        const isNextPhase = this.flightPhaseManager.phase === FmgcFlightPhases.CLIMB;
        if (s === FMCMainDisplay.clrValue) {
            this.preSelectedCrzSpeed = undefined;
            if (isNextPhase) {
                this.updatePreSelSpeedMach(undefined);
            }
            return true;
        }

        const MACH_OR_SPD_REGEX = /^(\.\d{1,2}|\d{1,3})$/;
        if (s.match(MACH_OR_SPD_REGEX) === null) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }

        const v = parseFloat(s);
        if (!Number.isFinite(v)) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }

        if (v < 1) {
            const mach = Math.round(v * 100) / 100;
            if (mach < 0.15 || mach > 0.82) {
                this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                return false;
            }

            this.preSelectedCrzSpeed = mach;
        } else {
            const spd = Math.round(v);
            if (spd < 100 || spd > 350) {
                this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                return false;
            }

            this.preSelectedCrzSpeed = spd;
        }

        if (isNextPhase) {
            this.updatePreSelSpeedMach(this.preSelectedCrzSpeed);
        }

        return true;
    }

    setPerfApprQNH(s) {
        if (s === FMCMainDisplay.clrValue) {
            const dest = this.flightPlanService.active.destinationAirport;
            const distanceToDestination = Number.isFinite(this.getDistanceToDestination()) ? this.getDistanceToDestination() : -1;

            if (dest && distanceToDestination < 180) {
                this.setScratchpadMessage(NXSystemMessages.notAllowed);
                return false;
            } else {
                this.perfApprQNH = NaN;
                return true;
            }
        }

        const value = parseFloat(s);
        const HPA_REGEX = /^[01]?[0-9]{3}$/;
        const INHG_REGEX = /^([23][0-9]|[0-9]{2}\.)[0-9]{2}$/;

        if (HPA_REGEX.test(s)) {
            if (value >= 745 && value <= 1050) {
                this.perfApprQNH = value;
                SimVar.SetSimVarValue("L:A32NX_DESTINATION_QNH", "Millibar", this.perfApprQNH);
                return true;
            } else {
                this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                return false;
            }
        } else if (INHG_REGEX.test(s)) {
            if (value >= 2200 && value <= 3100) {
                this.perfApprQNH = value / 100;
                SimVar.SetSimVarValue("L:A32NX_DESTINATION_QNH", "Millibar", this.perfApprQNH * 33.8639);
                return true;
            } else if (value >= 22.0 && value <= 31.00) {
                this.perfApprQNH = value;
                SimVar.SetSimVarValue("L:A32NX_DESTINATION_QNH", "Millibar", this.perfApprQNH * 33.8639);
                return true;
            } else {
                this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                return false;
            }
        }
        this.setScratchpadMessage(NXSystemMessages.formatError);
        return false;
    }

    setPerfApprTemp(s) {
        if (s === FMCMainDisplay.clrValue) {
            const dest = this.flightPlanService.active.destinationAirport;
            const distanceToDestination = Number.isFinite(this.getDistanceToDestination()) ? this.getDistanceToDestination() : -1;

            if (dest && distanceToDestination < 180) {
                this.setScratchpadMessage(NXSystemMessages.notAllowed);
                return false;
            } else {
                this.perfApprTemp = NaN;
                return true;
            }
        }

        if (!/^[\+\-]?\d{1,2}$/.test(s)) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }
        this.perfApprTemp = parseInt(s);
        return true;
    }

    setPerfApprWind(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.perfApprWindHeading = NaN;
            this.perfApprWindSpeed = NaN;
            return true;
        }

        // both must be entered
        if (!/^\d{1,3}\/\d{1,3}$/.test(s)) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }
        const [dir, mag] = s.split("/").map((v) => parseInt(v));
        if (dir > 360 || mag > 500) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        this.perfApprWindHeading = dir % 360; // 360 is displayed as 0
        this.perfApprWindSpeed = mag;
        return true;
    }

    setPerfApprTransAlt(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.flightPlanService.setPerformanceData('pilotTransitionLevel', null);
            this.updateTransitionAltitudeLevel();
            return true;
        }

        if (!/^\d{4,5}$/.test(s)) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }
        const value = Math.round(parseInt(s) / 10) * 10;
        if (value < 1000 || value > 45000) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }

        this.flightPlanService.setPerformanceData('pilotTransitionLevel', Math.round(value / 100));
        this.updateTransitionAltitudeLevel();
        return true;
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

    /**
     * VApp for _selected_ landing config with GSMini correction
     */
    getVAppGsMini() {
        let vAppTarget = this.getVApp();
        if (isFinite(this.perfApprWindSpeed) && isFinite(this.perfApprWindHeading)) {
            vAppTarget = NXSpeedsUtils.getVtargetGSMini(vAppTarget, NXSpeedsUtils.getHeadWindDiff(this._towerHeadwind));
        }
        return vAppTarget;
    }

    //Needs PR Merge #3154
    setPerfApprVApp(s) {
        if (s === FMCMainDisplay.clrValue) {
            if (isFinite(this.vApp)) {
                this.vApp = NaN;
                return true;
            }
        } else {
            if (s.includes(".")) {
                this.setScratchpadMessage(NXSystemMessages.formatError);
                return false;
            }
            const value = parseInt(s);
            if (isFinite(value) && value >= 90 && value <= 350) {
                this.vApp = value;
                return true;
            }
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        this.setScratchpadMessage(NXSystemMessages.notAllowed);
        return false;
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

    setPerfApprMDA(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.perfApprMDA = null;
            SimVar.SetSimVarValue("L:AIRLINER_MINIMUM_DESCENT_ALTITUDE", "feet", 0);
            return true;
        } else if (s.match(/^[0-9]{1,5}$/) !== null) {
            const value = parseInt(s);

            const activePlan = this.flightPlanService.active;

            let ldgRwy = activePlan.destinationRunway;

            if (!ldgRwy) {
                if (activePlan.availableDestinationRunways.length > 0) {
                    ldgRwy = activePlan.availableDestinationRunways[0];
                }
            }

            const limitLo = ldgRwy ? ldgRwy.thresholdLocation.alt : 0;
            const limitHi = ldgRwy ? ldgRwy.thresholdLocation.alt + 5000 : 39000;

            if (value >= limitLo && value <= limitHi) {
                this.perfApprMDA = value;
                SimVar.SetSimVarValue("L:AIRLINER_MINIMUM_DESCENT_ALTITUDE", "feet", this.perfApprMDA);
                return true;
            }
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        } else {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }
    }

    setPerfApprDH(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.perfApprDH = null;
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
                this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                return false;
            }
        } else {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }
    }

    setPerfApprFlaps3(s) {
        this.perfApprFlaps3 = s;
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_LANDING_CONF3", "boolean", s);
    }

    /** @param {string} icao ID of the navaid to de-select */
    deselectNavaid(icao) {
        this.navigation.getNavaidTuner().deselectNavaid(icao);
    }

    reselectNavaid(icao) {
        this.navigation.getNavaidTuner().reselectNavaid(icao);
    }

    /** @returns {string[]} icaos of deselected navaids */
    get deselectedNavaids() {
        return this.navigation.getNavaidTuner().deselectedNavaids;
    }

    getVorTuningData(index) {
        return this.navigation.getNavaidTuner().getVorRadioTuningStatus(index);
    }

    /**
     * Set a manually tuned VOR
     * @param {1 | 2} index
     * @param {RawVor | number | null} facilityOrFrequency null to clear
     */
    setManualVor(index, facilityOrFrequency) {
        return this.navigation.getNavaidTuner().setManualVor(index, facilityOrFrequency);
    }

    /**
     * Set a VOR course
     * @param {1 | 2} index
     * @param {number | null} course null to clear
     */
    setVorCourse(index, course) {
        return this.navigation.getNavaidTuner().setVorCourse(index, course);
    }

    getMmrTuningData(index) {
        return this.navigation.getNavaidTuner().getMmrRadioTuningStatus(index);
    }

    /**
     * Set a manually tuned ILS
     * @param {RawVor | number | null} facilityOrFrequency null to clear
     */
    async setManualIls(facilityOrFrequency) {
        return await this.navigation.getNavaidTuner().setManualIls(facilityOrFrequency);
    }

    /**
     * Set an ILS course
     * @param {number | null} course null to clear
     * @param {boolean} backcourse Whether the course is a backcourse/backbeam.
     */
    setIlsCourse(course, backcourse = false) {
        return this.navigation.getNavaidTuner().setIlsCourse(course, backcourse);
    }

    getAdfTuningData(index) {
        return this.navigation.getNavaidTuner().getAdfRadioTuningStatus(index);
    }

    /**
     * Set a manually tuned NDB
     * @param {1 | 2} index
     * @param {RawNdb | number | null} facilityOrFrequency null to clear
     */
    setManualAdf(index, facilityOrFrequency) {
        return this.navigation.getNavaidTuner().setManualAdf(index, facilityOrFrequency);
    }

    isMmrTuningLocked() {
        return this.navigation.getNavaidTuner().isMmrTuningLocked();
    }

    isFmTuningActive() {
        return this.navigation.getNavaidTuner().isFmTuningActive();
    }

    /**
     * Get the currently selected navaids
     * @returns {SelectedNavaid[]}
     */
    getSelectedNavaids() {
        // FIXME 2 when serving CDU 2
        return this.navigation.getSelectedNavaids(1);
    }

    /**
     * Set the takeoff flap config
     * @param {0 | 1 | 2 | 3 | null} flaps
     */
    /* private */ setTakeoffFlaps(flaps) {
        if (flaps !== this.flaps) {
            this.flaps = flaps;
            SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_FLAPS", "number", this.flaps !== null ? this.flaps : -1);

            this.arincDiscreteWord2.setBitValue(13, this.flaps === 0);
            this.arincDiscreteWord2.setBitValue(14, this.flaps === 1);
            this.arincDiscreteWord2.setBitValue(15, this.flaps === 2);
            this.arincDiscreteWord2.setBitValue(16, this.flaps === 3);
            this.arincDiscreteWord2.ssm = Arinc429Word.SignStatusMatrix.NormalOperation;
        }
    }

    /**
     * Set the takeoff trim config
     * @param {number | null} ths
     */
    /* private */ setTakeoffTrim(ths) {
        if (ths !== this.ths) {
            this.ths = ths;
            // legacy vars
            SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_THS", "degree", this.ths ? this.ths : 0);
            SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_THS_ENTERED", "bool", this.ths !== null);

            const ssm = this.ths !== null ? Arinc429Word.SignStatusMatrix.NormalOperation : Arinc429Word.SignStatusMatrix.NoComputedData;

            this.arincTakeoffPitchTrim.setBnrValue(this.ths ? -this.ths : 0, ssm, 12, 180, -180);
        }
    }

    trySetFlapsTHS(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.setTakeoffFlaps(null);
            this.setTakeoffTrim(null);
            this.tryCheckToData();
            return true;
        }

        let newFlaps = null;
        let newThs = null;

        let [flaps, ths] = s.split("/");

        if (flaps && flaps.length > 0) {
            if (!/^\d$/.test(flaps)) {
                this.setScratchpadMessage(NXSystemMessages.formatError);
                return false;
            }

            flaps = parseInt(flaps);
            if (flaps < 0 || flaps > 3) {
                this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                return false;
            }

            newFlaps = flaps;
        }

        if (ths && ths.length > 0) {
            // allow AAN.N and N.NAA, where AA is UP or DN
            if (!/^(UP|DN)(\d|\d?\.\d|\d\.\d?)|(\d|\d?\.\d|\d\.\d?)(UP|DN)$/.test(ths)) {
                this.setScratchpadMessage(NXSystemMessages.formatError);
                return false;
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
                    this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                    return false;
                }
                newThs = ths;
            }
        }

        if (newFlaps !== null) {
            if (this.flaps !== null) {
                this.tryCheckToData();
            }
            this.setTakeoffFlaps(newFlaps);
        }
        if (newThs !== null) {
            if (this.ths !== null) {
                this.tryCheckToData();
            }
            this.setTakeoffTrim(newThs);
        }
        return true;
    }

    checkEFOBBelowMin() {
        if (this._fuelPredDone) {
            if (!this._minDestFobEntered) {
                this.tryUpdateMinDestFob();
            }

            if (this._minDestFob) {
            // round & only use 100kgs precision since thats how it is displayed in fuel pred
                const destEfob = Math.round(this.getDestEFOB(this.isAnEngineOn()) * 10) / 10;
                const roundedMinDestFob = Math.round(this._minDestFob * 10) / 10;
                if (!this._isBelowMinDestFob) {
                    if (destEfob < roundedMinDestFob) {
                        this._isBelowMinDestFob = true;
                        // TODO should be in flight only and if fuel is below min dest efob for 2 minutes
                        if (this.isAnEngineOn()) {
                            setTimeout(() => {
                                this.addMessageToQueue(NXSystemMessages.destEfobBelowMin, () => {
                                    return this._EfobBelowMinClr === true;
                                }, () => {
                                    this._EfobBelowMinClr = true;
                                });
                            }, 120000);
                        } else {
                            this.addMessageToQueue(NXSystemMessages.destEfobBelowMin, () => {
                                return this._EfobBelowMinClr === true;
                            }, () => {
                                this._EfobBelowMinClr = true;
                            });
                        }
                    }
                } else {
                // check if we are at least 300kgs above min dest efob to show green again & the ability to trigger the message
                    if (roundedMinDestFob) {
                        if (destEfob - roundedMinDestFob >= 0.3) {
                            this._isBelowMinDestFob = false;
                            this.removeMessageFromQueue(NXSystemMessages.destEfobBelowMin);
                        }
                    }
                }
            }
        }
    }

    updateTowerHeadwind() {
        if (isFinite(this.perfApprWindSpeed) && isFinite(this.perfApprWindHeading)) {
            const activePlan = this.flightPlanService.active;

            if (activePlan.destinationRunway) {
                this._towerHeadwind = NXSpeedsUtils.getHeadwind(this.perfApprWindSpeed, this.perfApprWindHeading, activePlan.destinationRunway.magneticBearing);
            }
        }
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
        const activePlan = this.flightPlanService.active;
        const selectedRunway = activePlan.originRunway;

        if (!!selectedRunway) {
            const toRunway = Avionics.Utils.formatRunway(selectedRunway.ident);
            if (toRunway === this.toRunway) {
                return;
            }
            if (!!this.toRunway) {
                this.toRunway = toRunway;
                this._toFlexChecked = !isFinite(this.perfTOTemp);
                this.unconfirmedV1Speed = this.v1Speed;
                this.unconfirmedVRSpeed = this.vRSpeed;
                this.unconfirmedV2Speed = this.v2Speed;
                this.v1Speed = undefined;
                this.vRSpeed = undefined;
                this.v2Speed = undefined;

                if (!this.unconfirmedV1Speed && !this.unconfirmedVRSpeed && !this.unconfirmedV2Speed) {
                    return;
                }
                this.addMessageToQueue(NXSystemMessages.checkToData, (mcdu) => !this.unconfirmedV1Speed && !this.unconfirmedVRSpeed && !this.unconfirmedV2Speed && mcdu._toFlexChecked);
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
     * Set the progress page bearing/dist location
     * @param {string} ident ident of the waypoint or runway, will be replaced by "ENTRY" if brg/dist offset are specified
     * @param {LatLongAlt} coordinates co-ordinates of the waypoint/navaid/runway, without brg/dist offset
     * @param {string?} icao icao database id of the waypoint if applicable
     */
    _setProgLocation(ident, coordinates, icao) {
        console.log(`progLocation: ${ident} ${coordinates}`);
        this._progBrgDist = {
            icao,
            ident,
            coordinates,
            bearing: -1,
            distance: -1
        };

        this.updateProgDistance();
    }

    /**
     * Try to set the progress page bearing/dist waypoint/location
     * @param {String} s scratchpad entry
     * @param {Function} callback callback taking boolean arg for success/failure
     */
    trySetProgWaypoint(s, callback = EmptyCallback.Boolean) {
        if (s === FMCMainDisplay.clrValue) {
            this._progBrgDist = undefined;
            return callback(true);
        }

        Fmgc.WaypointEntryUtils.getOrCreateWaypoint(this, s, false, "ENTRY").then((wp) => {
            this._setProgLocation(wp.ident, wp.location, wp.databaseId);
            return callback(true);
        }).catch((err) => {
            // Rethrow if error is not an FMS message to display
            if (err.type === undefined) {
                throw err;
            }

            this.showFmsErrorMessage(err.type);
            return callback(false);
        });
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
     * @param wpt {import('msfs-navdata').Waypoint}
     */
    isWaypointInUse(wpt) {
        return this.flightPlanService.isWaypointInUse(wpt).then((inUseByFlightPlan) =>
            inUseByFlightPlan || (this._progBrgDist && this._progBrgDist.icao === wpt.databaseId)
        );
    }

    setGroundTempFromOrigin() {
        const origin = this.flightPlanService.active.originAirport;

        if (!origin) {
            return;
        }

        this.groundTempAuto = A32NX_Util.getIsaTemp(origin.location.alt);
    }

    trySetGroundTemp(scratchpadValue) {
        if (this.flightPhaseManager.phase !== FmgcFlightPhases.PREFLIGHT) {
            throw NXSystemMessages.notAllowed;
        }

        if (scratchpadValue === FMCMainDisplay.clrValue) {
            this.groundTempPilot = undefined;
            return;
        }

        if (scratchpadValue.match(/^[+\-]?[0-9]{1,2}$/) === null) {
            throw NXSystemMessages.formatError;
        }

        this.groundTempPilot = parseInt(scratchpadValue);
    }

    get groundTemp() {
        return this.groundTempPilot !== undefined ? this.groundTempPilot : this.groundTempAuto;
    }

    navModeEngaged() {
        const lateralMode = SimVar.GetSimVarValue("L:A32NX_FMA_LATERAL_MODE", "Number");
        switch (lateralMode) {
            case 20: // NAV
            case 30: // LOC*
            case 31: // LOC
            case 32: // LAND
            case 33: // FLARE
            case 34: // ROLL OUT
                return true;
        }
        return false;
    }

    /**
     * Add type 2 message to fmgc message queue
     * @param _message {TypeIIMessage} MessageObject
     * @param _isResolvedOverride {function(*)} Function that determines if the error is resolved at this moment (type II only).
     * @param _onClearOverride {function(*)} Function that executes when the error is actively cleared by the pilot (type II only).
     */
    addMessageToQueue(_message, _isResolvedOverride = undefined, _onClearOverride = undefined) {
        if (!_message.isTypeTwo) {
            return;
        }
        const message = _isResolvedOverride === undefined && _onClearOverride === undefined ? _message : _message.getModifiedMessage("", _isResolvedOverride, _onClearOverride);
        this._messageQueue.addMessage(message);
    }

    /**
     * Removes a message from the queue
     * @param value {String}
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

    /**
     * Generic function which returns true if engine(index) is ON (N2 > 20)
     * @returns {boolean}
     */
    isEngineOn(index) {
        return SimVar.GetSimVarValue(`L:A32NX_ENGINE_N2:${index}`, 'number') > 20;
    }
    /**
     * Returns true if any one engine is running (N2 > 20)
     * @returns {boolean}
     */
    //TODO: can this be an util?
    isAnEngineOn() {
        return this.isEngineOn(1) || this.isEngineOn(2);
    }

    /**
     * Returns true only if all engines are running (N2 > 20)
     * @returns {boolean}
     */
    //TODO: can this be an util?
    isAllEngineOn() {
        return this.isEngineOn(1) && this.isEngineOn(2);
    }

    isOnGround() {
        return SimVar.GetSimVarValue("L:A32NX_LGCIU_1_NOSE_GEAR_COMPRESSED", "Number") === 1 || SimVar.GetSimVarValue("L:A32NX_LGCIU_2_NOSE_GEAR_COMPRESSED", "Number") === 1;
    }

    isFlying() {
        return this.flightPhaseManager.phase >= FmgcFlightPhases.TAKEOFF && this.flightPhaseManager.phase < FmgcFlightPhases.DONE;
    }
    /**
     * Returns the maximum cruise FL for ISA temp and GW
     * @param temp {number} ISA in C°
     * @param gw {number} GW in t
     * @returns {number} MAX FL
     */
    //TODO: can this be an util?
    getMaxFL(temp = A32NX_Util.getIsaTempDeviation(), gw = this.getGW()) {
        return Math.round(temp <= 10 ? -2.778 * gw + 578.667 : (temp * (-0.039) - 2.389) * gw + temp * (-0.667) + 585.334);
    }

    /**
     * Returns the maximum allowed cruise FL considering max service FL
     * @param fl {number} FL to check
     * @returns {number} maximum allowed cruise FL
     */
    //TODO: can this be an util?
    getMaxFlCorrected(fl = this.getMaxFL()) {
        return fl >= this.recMaxCruiseFL ? this.recMaxCruiseFL : fl;
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
     * Retrieves current fuel on boad in tons.
     *
     * @returns {number | undefined} current fuel on board in tons, or undefined if fuel readings are not available.
     */
    //TODO: Can this be util?
    getFOB() {
        const useFqi = this.isAnEngineOn();

        // If an engine is not running, use pilot entered block fuel to calculate fuel predictions
        return useFqi ? (SimVar.GetSimVarValue("FUEL TOTAL QUANTITY WEIGHT", "pound") * 0.4535934) / 1000 : this.blockFuel;
    }

    /**
     * retrieves gross weight in tons or 0 if not available
     * @returns {number}
     * @deprecated use getGrossWeight() instead
     */
    //TODO: Can this be util?
    getGW() {
        const fmGwOrNull = this.getGrossWeight();
        const fmGw = fmGwOrNull !== null ? fmGwOrNull : 0;

        SimVar.SetSimVarValue("L:A32NX_FM_GROSS_WEIGHT", "Number", fmGw);
        return fmGw;
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

    /**
     * Gets the entered zero fuel weight, or undefined if not entered
     * @returns {number | undefined} the zero fuel weight in tonnes or undefined
     */
    getZeroFuelWeight() {
        return this.zeroFuelWeight;
    }

    getV2Speed() {
        return this.v2Speed;
    }

    getTropoPause() {
        return this.tropo;
    }

    getManagedClimbSpeed() {
        return this.managedSpeedClimb;
    }

    getManagedClimbSpeedMach() {
        return this.managedSpeedClimbMach;
    }

    getManagedCruiseSpeed() {
        return this.managedSpeedCruise;
    }

    getManagedCruiseSpeedMach() {
        return this.managedSpeedCruiseMach;
    }

    getAccelerationAltitude() {
        const plan = this.currFlightPlanService.active;

        if (plan) {
            return plan.performanceData.accelerationAltitude;
        }

        return undefined;
    }

    getThrustReductionAltitude() {
        const plan = this.currFlightPlanService.active;

        if (plan) {
            return plan.performanceData.thrustReductionAltitude;
        }

        return undefined;
    }

    getOriginTransitionAltitude() {
        const plan = this.currFlightPlanService.active;

        if (plan) {
            return plan.performanceData.transitionAltitude;
        }

        return undefined;
    }

    getDestinationTransitionLevel() {
        const plan = this.currFlightPlanService.active;

        if (plan) {
            return plan.performanceData.transitionLevel;
        }

        return undefined;
    }

    get cruiseLevel() {
        const plan = this.currFlightPlanService.active;

        if (plan) {
            return plan.performanceData.cruiseFlightLevel;
        }

        return undefined;
    }

    set cruiseLevel(level) {
        const plan = this.currFlightPlanService.active;

        if (plan) {
            this.currFlightPlanService.setPerformanceData('cruiseFlightLevel', level);
            // used by FlightPhaseManager
            SimVar.SetSimVarValue('L:A32NX_AIRLINER_CRUISE_ALTITUDE', 'number', Number.isFinite(level * 100) ? level * 100 : 0);
        }
    }

    get costIndex() {
        const plan = this.currFlightPlanService.active;

        if (plan) {
            return plan.performanceData.costIndex;
        }

        return undefined;
    }

    set costIndex(ci) {
        const plan = this.currFlightPlanService.active;

        if (plan) {
            this.currFlightPlanService.setPerformanceData('costIndex', ci);
        }
    }

    get isCostIndexSet() {
        const plan = this.currFlightPlanService.active;

        if (plan) {
            return plan.performanceData.costIndex !== undefined;
        }

        return false;
    }

    get tropo() {
        const plan = this.currFlightPlanService.active;

        if (plan) {
            return plan.performanceData.tropopause;
        }

        return undefined;
    }

    get isTropoPilotEntered() {
        const plan = this.currFlightPlanService.active;

        if (plan) {
            return plan.performanceData.tropopauseIsPilotEntered;
        }

        return false;
    }

    set tropo(tropo) {
        const plan = this.currFlightPlanService.active;

        if (plan) {
            this.currFlightPlanService.setPerformanceData('pilotTropopause', tropo);
        }
    }

    get flightNumber() {
        const plan = this.currFlightPlanService.active;

        if (plan) {
            return this.currFlightPlanService.active.flightNumber;
        }

        return undefined;

    }

    set flightNumber(flightNumber) {
        const plan = this.currFlightPlanService.active;

        if (plan) {
            this.currFlightPlanService.setFlightNumber(flightNumber);
        }
    }

    getFlightPhase() {
        return this.flightPhaseManager.phase;
    }

    getClimbSpeedLimit() {
        return {
            speed: this.climbSpeedLimit,
            underAltitude: this.climbSpeedLimitAlt,
        };
    }

    getDescentSpeedLimit() {
        return {
            speed: this.descentSpeedLimit,
            underAltitude: this.descentSpeedLimitAlt,
        };
    }

    getPreSelectedClbSpeed() {
        return this.preSelectedClbSpeed;
    }

    getPreSelectedCruiseSpeed() {
        return this.preSelectedCrzSpeed;
    }

    getTakeoffFlapsSetting() {
        return this.flaps;
    }

    getManagedDescentSpeed() {
        return this.managedSpeedDescendPilot !== undefined ? this.managedSpeedDescendPilot : this.managedSpeedDescend;
    }

    getManagedDescentSpeedMach() {
        return this.managedSpeedDescendMachPilot !== undefined ? this.managedSpeedDescendMachPilot : this.managedSpeedDescendMach;
    }

    getApproachSpeed() {
        return this.approachSpeeds && this.approachSpeeds.valid ? this.approachSpeeds.vapp : 0;
    }

    getFlapRetractionSpeed() {
        return this.approachSpeeds && this.approachSpeeds.valid ? this.approachSpeeds.f : 0;
    }

    getSlatRetractionSpeed() {
        return this.approachSpeeds && this.approachSpeeds.valid ? this.approachSpeeds.s : 0;
    }

    getCleanSpeed() {
        return this.approachSpeeds && this.approachSpeeds.valid ? this.approachSpeeds.gd : 0;
    }

    getTripWind() {
        // FIXME convert vnav to use +ve for tailwind, -ve for headwind, it's the other way around at the moment
        return -this.averageWind;
    }

    getWinds() {
        return this.winds;
    }

    getApproachWind() {
        const activePlan = this.currFlightPlanService.active;
        const destination = activePlan.destinationAirport;

        if (!destination || !destination.location || !isFinite(this.perfApprWindHeading)) {
            return { direction: 0, speed: 0 };
        }

        const magVar = Facilities.getMagVar(destination.location.lat, destination.location.long);
        const trueHeading = A32NX_Util.magneticToTrue(this.perfApprWindHeading, magVar);

        return { direction: trueHeading, speed: this.perfApprWindSpeed };
    }

    getApproachQnh() {
        return this.perfApprQNH;
    }

    getApproachTemperature() {
        return this.perfApprTemp;
    }

    getDestinationElevation() {
        return Number.isFinite(this.landingElevation) ? this.landingElevation : 0;
    }

    trySetManagedDescentSpeed(value) {
        if (value === FMCMainDisplay.clrValue) {
            this.managedSpeedDescendPilot = undefined;
            this.managedSpeedDescendMachPilot = undefined;
            return true;
        }

        const MACH_SLASH_SPD_REGEX = /^(\.\d{1,2})?\/(\d{3})?$/;
        const machSlashSpeedMatch = value.match(MACH_SLASH_SPD_REGEX);

        const MACH_REGEX = /^\.\d{1,2}$/;
        const SPD_REGEX = /^\d{1,3}$/;

        if (machSlashSpeedMatch !== null /* ".NN/" or "/NNN" entry */) {
            const speed = parseInt(machSlashSpeedMatch[2]);
            if (Number.isFinite(speed)) {
                if (speed < 100 || speed > 350) {
                    this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                    return false;
                }

                this.managedSpeedDescendPilot = speed;
            }

            const mach = Math.round(parseFloat(machSlashSpeedMatch[1]) * 1000) / 1000;
            if (Number.isFinite(mach)) {
                if (mach < 0.15 || mach > 0.82) {
                    this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                    return false;
                }

                this.managedSpeedDescendMachPilot = mach;
            }

            return true;
        } else if (value.match(MACH_REGEX) !== null /* ".NN" */) {
            // Entry of a Mach number only without a slash is allowed
            const mach = Math.round(parseFloat(value) * 1000) / 1000;
            if (Number.isFinite(mach)) {
                if (mach < 0.15 || mach > 0.82) {
                    this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                    return false;
                }

                this.managedSpeedDescendMachPilot = mach;
            }

            return true;
        } else if (value.match(SPD_REGEX) !== null /* "NNN" */) {
            const speed = parseInt(value);
            if (Number.isFinite(speed)) {
                if (speed < 100 || speed > 350) {
                    this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                    return false;
                }

                // This is the maximum managed Mach number you can get, even with CI 100.
                // Through direct testing by a pilot, it was also determined that the plane gives Mach 0.80 for all of the tested CAS entries.
                const mach = 0.8;

                this.managedSpeedDescendPilot = speed;
                this.managedSpeedDescendMachPilot = mach;

                return true;
            }
        }

        this.setScratchpadMessage(NXSystemMessages.formatError);
        return false;
    }

    trySetPerfClbPredToAltitude(value) {
        if (value === FMCMainDisplay.clrValue) {
            this.perfClbPredToAltitudePilot = undefined;
            return true;
        }

        const currentAlt = SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');
        const match = value.match(/^(FL\d{3}|\d{1,5})$/);
        if (match === null || match.length < 1) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }

        const altOrFlString = match[1].replace("FL", "");
        const altitude = altOrFlString.length < 4 ? 100 * parseInt(altOrFlString) : parseInt(altOrFlString);

        if (!Number.isFinite(altitude)) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }

        if (altitude < currentAlt || (this.cruiseLevel && altitude > this.cruiseLevel * 100)) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }

        this.perfClbPredToAltitudePilot = altitude;
        return true;
    }

    trySetPerfDesPredToAltitude(value) {
        if (value === FMCMainDisplay.clrValue) {
            this.perfDesPredToAltitudePilot = undefined;
            return true;
        }

        const currentAlt = SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');
        const match = value.match(/^(FL\d{3}|\d{1,5})$/);
        if (match === null || match.length < 1) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }

        const altOrFlString = match[1].replace("FL", "");
        const altitude = altOrFlString.length < 4 ? 100 * parseInt(altOrFlString) : parseInt(altOrFlString);

        if (!Number.isFinite(altitude)) {
            this.setScratchpadMessage(NXSystemMessages.formatError);
            return false;
        }

        if (altitude > currentAlt) {
            this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }

        this.perfDesPredToAltitudePilot = altitude;
        return true;
    }

    updatePerfPageAltPredictions() {
        const currentAlt = SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');
        if (this.perfClbPredToAltitudePilot !== undefined && currentAlt > this.perfClbPredToAltitudePilot) {
            this.perfClbPredToAltitudePilot = undefined;
        }

        if (this.perfDesPredToAltitudePilot !== undefined && currentAlt < this.perfDesPredToAltitudePilot) {
            this.perfDesPredToAltitudePilot = undefined;
        }
    }

    computeManualCrossoverAltitude(mach) {
        const maximumCrossoverAltitude = 30594; // Crossover altitude of (300, 0.8)
        const mmoCrossoverAltitide = 24554; // Crossover altitude of (VMO, MMO)

        if (mach < 0.8) {
            return maximumCrossoverAltitude;
        }

        return maximumCrossoverAltitude + (mmoCrossoverAltitide - maximumCrossoverAltitude) * (mach - 0.8) / 0.02;
    }

    getActivePlanLegCount() {
        if (!this.flightPlanService.hasActive) {
            return 0;
        }

        return this.flightPlanService.active.legCount;
    }

    getDistanceToDestination() {
        return this.guidanceController.alongTrackDistanceToDestination;
    }

    /**
     * Modifies the active flight plan to go direct to a specific waypoint, not necessarily in the flight plan
     * @param {import('msfs-navdata').Waypoint} waypoint
     */
    async directToWaypoint(waypoint) {
        // FIXME fm pos
        const adirLat = ADIRS.getLatitude();
        const adirLong = ADIRS.getLongitude();
        const trueTrack = ADIRS.getTrueTrack();

        if (!adirLat.isNormalOperation() || !adirLong.isNormalOperation() || !trueTrack.isNormalOperation()) {
            return;
        }

        const ppos = {
            lat: adirLat.value,
            long: adirLong.value,
        };

        await this.flightPlanService.directToWaypoint(ppos, trueTrack.value, waypoint);
    }

    /**
     * Modifies the active flight plan to go direct to a specific leg
     * @param {number} legIndex index of leg to go direct to
     */
    async directToLeg(legIndex) {
        // FIXME fm pos
        const adirLat = ADIRS.getLatitude();
        const adirLong = ADIRS.getLongitude();
        const trueTrack = ADIRS.getTrueTrack();

        if (!adirLat.isNormalOperation() || !adirLong.isNormalOperation() || !trueTrack.isNormalOperation()) {
            return;
        }

        const ppos = {
            lat: adirLat.value,
            long: adirLong.value,
        };

        await this.flightPlanService.directToLeg(ppos, trueTrack.value, legIndex);
    }

    /**
     * Gets the navigation database ident (including cycle info).
     * @returns {import('msfs-navdata').DatabaseIdent | null}.
     */
    getNavDatabaseIdent() {
        return this.navDbIdent;
    }
}

FMCMainDisplay.clrValue = "\xa0\xa0\xa0\xa0\xa0CLR";
FMCMainDisplay.ovfyValue = "\u0394";
FMCMainDisplay._AvailableKeys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const FlightPlans = Object.freeze({
    Active: 0,
    Temporary: 1,
});

class FmArinc429OutputWord extends Arinc429Word {
    constructor(name, value = 0) {
        super(0);

        this.name = name;
        this.dirty = true;
        this._value = value;
        this._ssm = 0;
    }

    get value() {
        return this._value;
    }

    set value(value) {
        if (this._value !== value) {
            this.dirty = true;
        }
        this._value = value;
    }

    get ssm() {
        return this._ssm;
    }

    set ssm(ssm) {
        if (this._ssm !== ssm) {
            this.dirty = true;
        }
        this._ssm = ssm;
    }

    static empty(name) {
        return new FmArinc429OutputWord(name, 0);
    }

    async writeToSimVarIfDirty() {
        if (this.dirty) {
            this.dirty = false;
            return Promise.all([
                Arinc429Word.toSimVarValue(`L:A32NX_FM1_${this.name}`, this.value, this.ssm),
                Arinc429Word.toSimVarValue(`L:A32NX_FM2_${this.name}`, this.value, this.ssm),
            ]);
        }
        return Promise.resolve();
    }

    setBnrValue(value, ssm, bits, rangeMax, rangeMin = 0) {
        const quantum = Math.max(Math.abs(rangeMin), rangeMax) / 2 ** bits;
        const data = Math.max(rangeMin, Math.min(rangeMax, Math.round(value / quantum) * quantum));

        this.value = data;
        this.ssm = ssm;
    }
}
