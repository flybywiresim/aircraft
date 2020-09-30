class A320_Neo_CDU_MainDisplay extends FMCMainDisplay {
    constructor() {
        super(...arguments);
        this._registered = false;
        this._forceNextAltitudeUpdate = false;
        this._lastUpdateAPTime = NaN;
        this.refreshFlightPlanCooldown = 0;
        this.updateAutopilotCooldown = 0;
        this._lastHasReachFlex = false;
        this._apMasterStatus = false;
        this._hasReachedTopOfDescent = false;
        this._apCooldown = 500;
        this._lastRequestedFLCModeWaypointIndex = -1;
    }
    get templateID() { return "A320_Neo_CDU"; }
    connectedCallback() {
        super.connectedCallback();
        RegisterViewListener("JS_LISTENER_KEYEVENT", () => {
            console.log("JS_LISTENER_KEYEVENT registered.");
            RegisterViewListener("JS_LISTENER_FACILITY", () => {
                console.log("JS_LISTENER_FACILITY registered.");
                this._registered = true;
            });
        });
    }
    Init() {
        super.Init();
        this.A32NXCore = new A32NX_Core();
        this.A32NXCore.init(this._lastTime);

        this.defaultInputErrorMessage = "NOT ALLOWED";
        this.onDir = () => { CDUDirectToPage.ShowPage(this); };
        this.onProg = () => { CDUProgressPage.ShowPage(this); };
        this.onPerf = () => { CDUPerformancePage.ShowPage(this); };
        this.onInit = () => { CDUInitPage.ShowPage1(this); };
        this.onData = () => { CDUDataIndexPage.ShowPage1(this); };
        this.onFpln = () => { CDUFlightPlanPage.ShowPage(this); };
        this.onRad = () => { CDUNavRadioPage.ShowPage(this); };
        this.onFuel = () => { CDUFuelPredPage.ShowPage(this); };
        let mcduStartPage = SimVar.GetSimVarValue("L:A320_NEO_CDU_START_PAGE", "number");
	        if (mcduStartPage < 1) {
	            if (mcduStartPage < 1) {
	                CDUIdentPage.ShowPage(this);
	            }
	            else if (mcduStartPage === 10) {
	                CDUDirectToPage.ShowPage(this);
	            }
	            else if (mcduStartPage === 20) {
	                CDUProgressPage.ShowPage(this);
	            }
	            else if (mcduStartPage === 30) {
	                CDUPerformancePage.ShowPage(this);
	            }
	            else if (mcduStartPage === 31) {
	                CDUPerformancePage.ShowTAKEOFFPage(this);
	            }
	            else if (mcduStartPage === 32) {
	                CDUPerformancePage.ShowCLBPage(this);
	            }
	            else if (mcduStartPage === 33) {
	                CDUPerformancePage.ShowCRZPage(this);
	            }
	            else if (mcduStartPage === 34) {
	                CDUPerformancePage.ShowDESPage(this);
	            }
	            else if (mcduStartPage === 35) {
	                CDUPerformancePage.ShowAPPRPage(this);
	            }
	            else if (mcduStartPage === 40) {
	                CDUInitPage.ShowPage1(this);
	            }
	            else if (mcduStartPage === 50) {
	                CDUDataIndexPage.ShowPage(this);
	            }
	            else if (mcduStartPage === 60) {
	                CDUFlightPlanPage.ShowPage(this);
	            }
	            else if (mcduStartPage === 70) {
	                CDUNavRadioPage.ShowPage(this);
	            }
	            else if (mcduStartPage === 80) {
	                CDUFuelPredPage.ShowPage(this);
	            }
	            ;
	        }
        this.electricity = this.querySelector("#Electricity");
        this.climbTransitionGroundAltitude = null;
    }
    trySetFlapsTHS(s) {
        if (s) {
            let validEntry = false;
            let nextFlaps = this.flaps;
            let nextThs = this.ths;
            let [flaps, ths] = s.split("/");

            // Parse flaps
            if (flaps && flaps.length > 0) {
                if (!/^\d+$/.test(flaps)) {
                    this.showErrorMessage("FORMAT ERROR");
                    return false;
                }

                let vFlaps = parseInt(flaps);
                if (isFinite(vFlaps) && vFlaps > 0 && vFlaps < 4) {
                    nextFlaps = vFlaps;
                    validEntry = true;
                }
            }

            // Parse THS
            if (ths) {
                if (!/^((UP|DN)(\d?\.?\d)|(\d?\.?\d)(UP|DN))$/.test(ths)) {
                    this.showErrorMessage("FORMAT ERROR");
                    return false;
                }

                let direction = null;
                ths = ths.replace(/(UP|DN)/g, (substr) => {
                    direction = substr;
                    return "";
                });

                if (direction) {
                    const vThs = parseFloat(ths.trim());
                    if (isFinite(vThs) && vThs >= 0.0 && vThs <= 2.5) {

                        if (vThs === 0.0) {
                            // DN0.0 should be corrected to UP0.0
                            direction = "UP";
                        }

                        nextThs = `${direction}${vThs.toFixed(1)}`;
                        validEntry = true;
                    }
                }
            }

            // Commit changes.
            if (validEntry) {
                this.flaps = nextFlaps;
                this.ths = nextThs;
                return true;
            }
        }

        this.showErrorMessage("INVALID ENTRY");
        return false;
      }
    onPowerOn() {
        super.onPowerOn();
        if (Simplane.getAutoPilotAirspeedManaged()) {
            this._onModeManagedSpeed();
        }
        else if (Simplane.getAutoPilotAirspeedSelected()) {
            this._onModeSelectedSpeed();
        }
        this._onModeManagedHeading();
        this._onModeManagedAltitude();

        CDUPerformancePage.UpdateThrRedAccFromOrigin(this);

        SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);

        this.taxiFuelWeight = 0.2;
        CDUInitPage.updateTowIfNeeded(this);
    }
    Update() {
        super.Update();

        this.A32NXCore.update();

        this.updateAutopilot();

        this.updateScreenState();
    }

    updateScreenState() {
        if (SimVar.GetSimVarValue("L:ACPowerAvailable","bool")) {
            this.electricity.style.display = "block";
        } else {
            this.electricity.style.display = "none";
        }
    }

    getClbManagedSpeed() {
        let maxSpeed = Infinity;
        if (isFinite(this.v2Speed)) {
            let altitude = Simplane.getAltitude();
            if (altitude < this.thrustReductionAltitude) {
                maxSpeed = this.v2Speed + 50;
            }
        }
        let flapsHandleIndex = Simplane.getFlapsHandleIndex();
        if (flapsHandleIndex != 0) {
            return Math.min(maxSpeed, this.getFlapSpeed());
        }
        let dCI = this.costIndex / 999;
        dCI = dCI * dCI;
        let speed = 320 * (1 - dCI) + 330 * dCI;
        if (SimVar.GetSimVarValue("PLANE ALTITUDE", "feets") < 10000) {
            speed = Math.min(speed, 250);
        }
        return Math.min(maxSpeed, speed);
    }
    getFlapTakeOffSpeed() {
        let dWeight = (this.getWeight() - 47) / (78 - 47);
        return 119 + 34 * dWeight;
    }
    getSlatTakeOffSpeed() {
        let dWeight = (this.getWeight() - 47) / (78 - 47);
        return 154 + 44 * dWeight;
    }

    /**
     * Get aircraft takeoff and approach green dot speed
     * Calculation:
     * Gross weight in thousandths (KG) * 2 + 85 when below FL200
     * @returns {number}
     */
    getPerfGreenDotSpeed() {
        return ((this.getGrossWeight("kg") / 1000) * 2) + 85;
    }

    /**
     * Get the gross weight of the aircraft from the addition
     * of the ZFW, fuel and payload.
     * @param unit
     * @returns {number}
     */
    getGrossWeight(unit) {
        const fuelWeight = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY WEIGHT", unit);
        const emptyWeight = SimVar.GetSimVarValue("EMPTY WEIGHT", unit);
        const payloadWeight = this.getPayloadWeight(unit);
        return Math.round(emptyWeight + fuelWeight + payloadWeight);
    }

    /**
     * Get the payload of the aircraft, taking in to account each
     * payload station
     * @param unit
     * @returns {number}
     */
    getPayloadWeight(unit) {
        const payloadCount = SimVar.GetSimVarValue("PAYLOAD STATION COUNT", "number");
        let payloadWeight = 0;
        for (let i = 1; i <= payloadCount; i++) {
            payloadWeight += SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${i}`, unit);
        }
        return payloadWeight;
    }
    _onModeSelectedSpeed() {
        if (SimVar.GetSimVarValue("L:A320_FCU_SHOW_SELECTED_SPEED", "number") === 0) {
            let currentSpeed = Simplane.getIndicatedSpeed();
            this.setAPSelectedSpeed(currentSpeed, Aircraft.A320_NEO);
        }
        SimVar.SetSimVarValue("K:SPEED_SLOT_INDEX_SET", "number", 1);
    }
    _onModeManagedSpeed() {
        SimVar.SetSimVarValue("K:SPEED_SLOT_INDEX_SET", "number", 2);
        SimVar.SetSimVarValue("L:A320_FCU_SHOW_SELECTED_SPEED", "number", 0);
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
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 1, Simplane.getAutoPilotDisplayedAltitudeLockValue(), this._forceNextAltitudeUpdate);
    }
    _onModeManagedAltitude() {
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 1, Simplane.getAutoPilotDisplayedAltitudeLockValue(), this._forceNextAltitudeUpdate);
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, Simplane.getAutoPilotDisplayedAltitudeLockValue(), this._forceNextAltitudeUpdate);
        if (!Simplane.getAutoPilotGlideslopeHold()) {
            this.requestCall(() => {
                SimVar.SetSimVarValue("L:A320_NEO_FCU_FORCE_IDLE_VS", "Number", 1);
            });
        }
    }
    onEvent(_event) {
        super.onEvent(_event);
        console.log("A320_Neo_CDU_MainDisplay onEvent " + _event);
        if (_event === "MODE_SELECTED_SPEED") {
            this._onModeSelectedSpeed();
        }
        if (_event === "MODE_MANAGED_SPEED") {
            if (this.flightPlanManager.getWaypointsCount() === 0) {
                return;
            }
            this._onModeManagedSpeed();
        }
        if (_event === "MODE_SELECTED_HEADING") {
            if (this.flightPlanManager.getWaypointsCount() === 0) {
                return;
            }
            if (Simplane.getAutoPilotHeadingManaged()) {
                if (SimVar.GetSimVarValue("L:A320_FCU_SHOW_SELECTED_HEADING", "number") === 0) {
                    let currentHeading = Simplane.getHeadingMagnetic();
                    Coherent.call("HEADING_BUG_SET", 1, currentHeading);
                }
            }
            this._onModeSelectedHeading();
        }
        if (_event === "MODE_MANAGED_HEADING") {
            if (this.flightPlanManager.getWaypointsCount() === 0) {
                return;
            }
            this._onModeManagedHeading();
        }
        if (_event === "MODE_SELECTED_ALTITUDE") {
            this._onModeSelectedAltitude();
        }
        if (_event === "MODE_MANAGED_ALTITUDE") {
            this._onModeManagedAltitude();
        }
        if (_event === "AP_DEC_SPEED" || _event === "AP_INC_SPEED") {
            if (SimVar.GetSimVarValue("L:A320_FCU_SHOW_SELECTED_SPEED", "number") === 0) {
                let currentSpeed = Simplane.getIndicatedSpeed();
                this.setAPSelectedSpeed(currentSpeed, Aircraft.A320_NEO);
            }
            SimVar.SetSimVarValue("L:A320_FCU_SHOW_SELECTED_SPEED", "number", 1);
        }
        if (_event === "AP_DEC_HEADING" || _event === "AP_INC_HEADING") {
            if (SimVar.GetSimVarValue("L:A320_FCU_SHOW_SELECTED_HEADING", "number") === 0) {
                let currentHeading = Simplane.getHeadingMagnetic();
                Coherent.call("HEADING_BUG_SET", 1, currentHeading);
            }
            SimVar.SetSimVarValue("L:A320_FCU_SHOW_SELECTED_HEADING", "number", 1);
        }
    }
    onFlightPhaseChanged() {
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CLIMB) {
            if (isFinite(this.preSelectedClbSpeed)) {
                this.setAPSelectedSpeed(this.preSelectedClbSpeed, Aircraft.A320_NEO);
                SimVar.SetSimVarValue("K:SPEED_SLOT_INDEX_SET", "number", 1);
            }
        }
        else if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CRUISE) {
            if (isFinite(this.preSelectedCrzSpeed)) {
                this.setAPSelectedSpeed(this.preSelectedCrzSpeed, Aircraft.A320_NEO);
                SimVar.SetSimVarValue("K:SPEED_SLOT_INDEX_SET", "number", 1);
            }
        }
        else if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_DESCENT) {
            if (isFinite(this.preSelectedDesSpeed)) {
                this.setAPSelectedSpeed(this.preSelectedDesSpeed, Aircraft.A320_NEO);
                SimVar.SetSimVarValue("K:SPEED_SLOT_INDEX_SET", "number", 1);
            }
        }
    }
    onInputAircraftSpecific(input) {
        if (input === "DIR") {
            if (this.onDir) {
                this.onDir();
            }
            return true;
        }
        else if (input === "PROG") {
            if (this.onProg) {
                this.onProg();
            }
            return true;
        }
        else if (input === "PERF") {
            if (this.onPerf) {
                this.onPerf();
            }
            return true;
        }
        else if (input === "INIT") {
            if (this.onInit) {
                this.onInit();
            }
            return true;
        }
        else if (input === "DATA") {
            if (this.onData) {
                this.onData();
            }
            return true;
        }
        else if (input === "FPLN") {
            if (this.onFpln) {
                this.onFpln();
            }
            return true;
        }
        else if (input === "RAD") {
            if (this.onRad) {
                this.onRad();
            }
            return true;
        }
        else if (input === "FUEL") {
            if (this.onFuel) {
                this.onFuel();
            }
            return true;
        }
        else if (input === "SEC") {
            if (this.onSec) {
                this.onSec();
            }
            return true;
        }
        else if (input === "ATC") {
            if (this.onAtc) {
                this.onAtc();
            }
            return true;
        }
        else if (input === "MCDU") {
            if (this.onMcdu) {
                this.onMcdu();
            }
            return true;
        }
        else if (input === "AIRPORT") {
            if (this.onAirport) {
                this.onAirport();
            }
            return true;
        }
        else if (input === "UP") {
            if (this.onUp) {
                this.onUp();
            }
            return true;
        }
        else if (input === "DOWN") {
            if (this.onDown) {
                this.onDown();
            }
            return true;
        }
        else if (input === "LEFT") {
            if (this.onLeft) {
                this.onLeft();
            }
            return true;
        }
        else if (input === "RIGHT") {
            if (this.onRight) {
                this.onRight();
            }
        }
        else if (input === "OVFY") {
            if (this.onOvfy) {
                this.onOvfy();
            }
            return true;
        }
        return false;
    }
    clearDisplay() {
        super.clearDisplay();
        this.onUp = undefined;
        this.onDown = undefined;
        this.onLeft = undefined;
        this.onRight = undefined;
    }
    getOrSelectWaypointByIdent(ident, callback) {
        this.dataManager.GetWaypointsByIdent(ident).then((waypoints) => {
            if (!waypoints || waypoints.length === 0) {
                return callback(undefined);
            }
            if (waypoints.length === 1) {
                return callback(waypoints[0]);
            }
            A320_Neo_CDU_SelectWptPage.ShowPage(this, waypoints, callback);
        });
    }

    _getTempIndex() {
        const temp = SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius");
        if (temp < -10)
            return 0;
        if (temp < 0)
            return 1;
        if (temp < 10)
            return 2;
        if (temp < 20)
            return 3;
        if (temp < 30)
            return 4;
        if (temp < 40)
            return 5;
        if (temp < 43)
            return 6;
        if (temp < 45)
            return 7;
        if (temp < 47)
            return 8;
        if (temp < 49)
            return 9;
        if (temp < 51)
            return 10;
        if (temp < 53)
            return 11;
        if (temp < 55)
            return 12;
        if (temp < 57)
            return 13;
        if (temp < 59)
            return 14;
        if (temp < 61)
            return 15;
        if (temp < 63)
            return 16;
        if (temp < 65)
            return 17;
        if (temp < 66)
            return 18;
        return 19;
    }

    _getVSpeed (dWeightCoef, min, max) {
        let runwayCoef = 1.0;
        const runway = this.flightPlanManager.getDepartureRunway() || this.flightPlanManager.getDetectedCurrentRunway();
        if (runway) {
            let f = (runway.length - 1500) / (2500 - 1500);
            runwayCoef = Utils.Clamp(f, 0, 1);
        }

        const flapsHandleIndex = this.flaps || Simplane.getFlapsHandleIndex();

        let vSpeed = min * (1 - runwayCoef) + max * runwayCoef;
        vSpeed *= dWeightCoef;
        vSpeed += (flapsHandleIndex - 1) * 6;
        return Math.round(vSpeed);
    }

    _getV1Speed () {
        let dWeightCoef = (this.getWeight(true) - 100) / (175 - 100);
        dWeightCoef = Utils.Clamp(dWeightCoef, 0, 1);
        dWeightCoef = 0.7 + (1.0 - 0.7) * dWeightCoef;

        const tempIndex = this._getTempIndex();
        let min = A320_Neo_CDU_MainDisplay._v1sConf1[tempIndex][0];
        let max = A320_Neo_CDU_MainDisplay._v1sConf1[tempIndex][1];

        return this._getVSpeed(dWeightCoef, min, max);
    }
    _computeV1Speed() {
        // computeV1Speed is called by inherited class so it must remain,
        // but we need the calculation logic so that sits in it's own function now.
        const nextV1 = this._getV1Speed();
        this.v1Speed = nextV1;
        SimVar.SetSimVarValue("L:AIRLINER_V1_SPEED", "Knots", nextV1);
    }

    _getVRSpeed() {
        let dWeightCoef = (this.getWeight(true) - 100) / (175 - 100);
        dWeightCoef = Utils.Clamp(dWeightCoef, 0, 1);
        dWeightCoef = 0.695 + (0.985 - 0.695) * dWeightCoef;

        const tempIndex = this._getTempIndex();
        let min = A320_Neo_CDU_MainDisplay._vRsConf1[tempIndex][0];
        let max = A320_Neo_CDU_MainDisplay._vRsConf1[tempIndex][1];

        return this._getVSpeed(dWeightCoef, min, max);
     }
    _computeVRSpeed() {
        // computeVRSpeed is called by inherited class so it must remain,
        // but we need the calculation logic so that sits in it's own function now.
        const nextVR = this._getVRSpeed();
        this.vRSpeed = nextVR;
        SimVar.SetSimVarValue("L:AIRLINER_VR_SPEED", "Knots", nextVR);
    }

    _getV2Speed() {
        let dWeightCoef = (this.getWeight(true) - 100) / (175 - 100);
        dWeightCoef = Utils.Clamp(dWeightCoef, 0, 1);
        dWeightCoef = 0.71 + (0.96 - 0.71) * dWeightCoef;

        const tempIndex = this._getTempIndex();
        let min = A320_Neo_CDU_MainDisplay._v2sConf1[tempIndex][0];
        let max = A320_Neo_CDU_MainDisplay._v2sConf1[tempIndex][1];

        return this._getVSpeed(dWeightCoef, min, max);
    }
    _computeV2Speed() {
        // computeV2Speed is called by inherited class so it must remain,
        // but we need the calculation logic so that sits in it's own function now.
        const nextV2 = this._getV2Speed();
        this.v2Speed = nextV2;
        SimVar.SetSimVarValue("L:AIRLINER_V2_SPEED", "Knots", nextV2);
    }

    getThrustTakeOffLimit() {
        if (this.perfTOTemp <= 10) {
            return 92.8;
        }
        if (this.perfTOTemp <= 40) {
            return 92.8;
        }
        if (this.perfTOTemp <= 45) {
            return 92.2;
        }
        if (this.perfTOTemp <= 50) {
            return 90.5;
        }
        if (this.perfTOTemp <= 55) {
            return 88.8;
        }
        return 88.4;
    }
    getThrustClimbLimit() {
        return this.getThrustTakeOffLimit() - 8;
    }
    isAirspeedManaged() {
        return SimVar.GetSimVarValue("AUTOPILOT SPEED SLOT INDEX", "number") === 2;
    }
    isHeadingManaged() {
        return SimVar.GetSimVarValue("AUTOPILOT HEADING SLOT INDEX", "number") === 2;
    }
    isAltitudeManaged() {
        return SimVar.GetSimVarValue("AUTOPILOT ALTITUDE SLOT INDEX", "number") === 2;
    }
    isVerticalSpeedManaged() {
        return SimVar.GetSimVarValue("AUTOPILOT VS SLOT INDEX", "number") === 2;
    }
    updateAutopilot() {
        let now = performance.now();
        let dt = now - this._lastUpdateAPTime;
        let apLogicOn = (this._apMasterStatus || Simplane.getAutoPilotFlightDirectorActive(1));
        this._lastUpdateAPTime = now;
        if (isFinite(dt)) {
            this.updateAutopilotCooldown -= dt;
        }
        if (SimVar.GetSimVarValue("L:AIRLINER_FMC_FORCE_NEXT_UPDATE", "number") === 1) {
            SimVar.SetSimVarValue("L:AIRLINER_FMC_FORCE_NEXT_UPDATE", "number", 0);
            this.updateAutopilotCooldown = -1;
        }
        if (apLogicOn && this.currentFlightPhase >= FlightPhase.FLIGHT_PHASE_TAKEOFF) {
            if (this.isHeadingManaged()) {
                let heading = SimVar.GetSimVarValue("GPS COURSE TO STEER", "degree", "FMC");
                if (isFinite(heading)) {
                    Coherent.call("HEADING_BUG_SET", 2, heading);
                }
            }
        }
        if (this.updateAutopilotCooldown < 0) {
            let currentApMasterStatus = SimVar.GetSimVarValue("AUTOPILOT MASTER", "boolean");
            if (currentApMasterStatus != this._apMasterStatus) {
                this._apMasterStatus = currentApMasterStatus;
                apLogicOn = (this._apMasterStatus || Simplane.getAutoPilotFlightDirectorActive(1));
                this._forceNextAltitudeUpdate = true;
                console.log("Enforce AP in Altitude Lock mode. Cause : AP Master Status has changed.");
                SimVar.SetSimVarValue("L:A320_NEO_FCU_FORCE_IDLE_VS", "Number", 1);
                if (this._apMasterStatus) {
                    if (this.flightPlanManager.getWaypointsCount() === 0) {
                        this._onModeSelectedAltitude();
                        this._onModeSelectedHeading();
                        this._onModeSelectedSpeed();
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
            let currentHasReachedFlex = Simplane.getEngineThrottleMode(0) >= ThrottleMode.FLEX_MCT && Simplane.getEngineThrottleMode(1) >= ThrottleMode.FLEX_MCT;
            if (currentHasReachedFlex != this._lastHasReachFlex) {
                this._lastHasReachFlex = currentHasReachedFlex;
                console.log("Current Has Reached Flex = " + currentHasReachedFlex);
                if (currentHasReachedFlex) {
                    if (!SimVar.GetSimVarValue("AUTOPILOT THROTTLE ARM", "boolean")) {
                        SimVar.SetSimVarValue("K:AUTO_THROTTLE_ARM", "number", 1);
                    }
                }
            }
            let currentAltitude = Simplane.getAltitude();
            let groundSpeed = Simplane.getGroundSpeed();
            let apTargetAltitude = Simplane.getAutoPilotAltitudeLockValue("feet");
            let showTopOfClimb = false;
            let topOfClimbLlaHeading;
            let planeHeading = Simplane.getHeadingMagnetic();
            let planeCoordinates = new LatLong(SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude"), SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude"));
            if (apTargetAltitude > currentAltitude + 40) {
                let vSpeed = Simplane.getVerticalSpeed();
                let climbDuration = (apTargetAltitude - currentAltitude) / vSpeed / 60;
                let climbDistance = climbDuration * groundSpeed;
                if (climbDistance > 1) {
                    topOfClimbLlaHeading = this.flightPlanManager.getCoordinatesHeadingAtDistanceAlongFlightPlan(climbDistance);
                    if (topOfClimbLlaHeading) {
                        showTopOfClimb = true;
                    }
                }
            }
            if (showTopOfClimb) {
                SimVar.SetSimVarValue("L:AIRLINER_FMS_SHOW_TOP_CLIMB", "number", 1);
                SimVar.SetSimVarValue("L:AIRLINER_FMS_LAT_TOP_CLIMB", "number", topOfClimbLlaHeading.lla.lat);
                SimVar.SetSimVarValue("L:AIRLINER_FMS_LONG_TOP_CLIMB", "number", topOfClimbLlaHeading.lla.long);
                SimVar.SetSimVarValue("L:AIRLINER_FMS_HEADING_TOP_CLIMB", "number", topOfClimbLlaHeading.heading);
            }
            else {
                SimVar.SetSimVarValue("L:AIRLINER_FMS_SHOW_TOP_CLIMB", "number", 0);
            }
            SimVar.SetSimVarValue("SIMVAR_AUTOPILOT_AIRSPEED_MIN_CALCULATED", "knots", Simplane.getStallProtectionMinSpeed());
            SimVar.SetSimVarValue("SIMVAR_AUTOPILOT_AIRSPEED_MAX_CALCULATED", "knots", Simplane.getMaxSpeed(Aircraft.A320_NEO));
            if (this.isAltitudeManaged()) {
                let prevWaypoint = this.flightPlanManager.getPreviousActiveWaypoint();
                let nextWaypoint = this.flightPlanManager.getActiveWaypoint();
                if (prevWaypoint && nextWaypoint) {
                    let targetAltitude = nextWaypoint.legAltitude1;
                    if (nextWaypoint.legAltitudeDescription === 4) {
                        targetAltitude = Math.max(nextWaypoint.legAltitude1, nextWaypoint.legAltitude2);
                    }
                    let showTopOfDescent = false;
                    let topOfDescentLat;
                    let topOfDescentLong;
                    let topOfDescentHeading;
                    this._hasReachedTopOfDescent = true;
                    if (currentAltitude > targetAltitude + 40) {
                        let vSpeed = Math.abs(Math.min(0, Simplane.getVerticalSpeed()));
                        if (vSpeed < 200) {
                            vSpeed = 2000;
                        }
                        let descentDuration = Math.abs(targetAltitude - currentAltitude) / vSpeed / 60;
                        let descentDistance = descentDuration * groundSpeed;
                        let distanceToTarget = Avionics.Utils.computeGreatCircleDistance(prevWaypoint.infos.coordinates, nextWaypoint.infos.coordinates);
                        showTopOfDescent = true;
                        let f = 1 - descentDistance / distanceToTarget;
                        topOfDescentLat = Avionics.Utils.lerpAngle(prevWaypoint.infos.lat, nextWaypoint.infos.lat, f);
                        topOfDescentLong = Avionics.Utils.lerpAngle(prevWaypoint.infos.long, nextWaypoint.infos.long, f);
                        topOfDescentHeading = nextWaypoint.bearingInFP;
                        if (distanceToTarget + 1 > descentDistance) {
                            this._hasReachedTopOfDescent = false;
                        }
                    }
                    if (showTopOfDescent) {
                        SimVar.SetSimVarValue("L:AIRLINER_FMS_SHOW_TOP_DSCNT", "number", 1);
                        SimVar.SetSimVarValue("L:AIRLINER_FMS_LAT_TOP_DSCNT", "number", topOfDescentLat);
                        SimVar.SetSimVarValue("L:AIRLINER_FMS_LONG_TOP_DSCNT", "number", topOfDescentLong);
                        SimVar.SetSimVarValue("L:AIRLINER_FMS_HEADING_TOP_DSCNT", "number", topOfDescentHeading);
                    }
                    else {
                        SimVar.SetSimVarValue("L:AIRLINER_FMS_SHOW_TOP_DSCNT", "number", 0);
                    }
                    let selectedAltitude = Simplane.getAutoPilotSelectedAltitudeLockValue("feet");
                    if (!this.flightPlanManager.getIsDirectTo() &&
                        isFinite(nextWaypoint.legAltitude1) &&
                        nextWaypoint.legAltitude1 < 20000 &&
                        nextWaypoint.legAltitude1 > selectedAltitude) {
                        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, nextWaypoint.legAltitude1, this._forceNextAltitudeUpdate);
                        this._forceNextAltitudeUpdate = false;
                        SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 1);
                    }
                    else {
                        let altitude = Simplane.getAutoPilotSelectedAltitudeLockValue("feet");
                        if (isFinite(altitude)) {
                            Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, altitude, this._forceNextAltitudeUpdate);
                            this._forceNextAltitudeUpdate = false;
                            SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 0);
                        }
                    }
                }
                else {
                    let altitude = Simplane.getAutoPilotSelectedAltitudeLockValue("feet");
                    if (isFinite(altitude)) {
                        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, altitude, this._forceNextAltitudeUpdate);
                        this._forceNextAltitudeUpdate = false;
                        SimVar.SetSimVarValue("L:AP_CURRENT_TARGET_ALTITUDE_IS_CONSTRAINT", "number", 0);
                    }
                }
            }
            if (!this.flightPlanManager.isActiveApproach()) {
                let activeWaypoint = this.flightPlanManager.getActiveWaypoint();
                let nextActiveWaypoint = this.flightPlanManager.getNextActiveWaypoint();
                if (activeWaypoint && nextActiveWaypoint) {
                    let pathAngle = nextActiveWaypoint.bearingInFP - activeWaypoint.bearingInFP;
                    while (pathAngle < 180) {
                        pathAngle += 360;
                    }
                    while (pathAngle > 180) {
                        pathAngle -= 360;
                    }
                    let absPathAngle = 180 - Math.abs(pathAngle);
                    let airspeed = Simplane.getIndicatedSpeed();
                    if (airspeed < 400) {
                        let turnRadius = airspeed * 360 / (1091 * 0.36 / airspeed) / 3600 / 2 / Math.PI;
                        let activateDistance = Math.pow(90 / absPathAngle, 1.6) * turnRadius * 1.2;
                        ;
                        let distanceToActive = Avionics.Utils.computeGreatCircleDistance(planeCoordinates, activeWaypoint.infos.coordinates);
                        if (distanceToActive < activateDistance) {
                            this.flightPlanManager.setActiveWaypointIndex(this.flightPlanManager.getActiveWaypointIndex() + 1);
                        }
                    }
                }
            }
            if (Simplane.getAutoPilotAltitudeManaged() && SimVar.GetSimVarValue("L:A320_NEO_FCU_STATE", "number") != 1) {
                let currentWaypointIndex = this.flightPlanManager.getActiveWaypointIndex();
                if (currentWaypointIndex != this._lastRequestedFLCModeWaypointIndex) {
                    this._lastRequestedFLCModeWaypointIndex = currentWaypointIndex;
                    setTimeout(() => {
                        if (Simplane.getAutoPilotAltitudeManaged()) {
                            this._onModeManagedAltitude();
                        }
                    }, 1000);
                }
            }
            if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_TAKEOFF) {
                let n1 = this.getThrustTakeOffLimit() / 100;
                SimVar.SetSimVarValue("AUTOPILOT THROTTLE MAX THRUST", "number", n1);
                if (this.isAirspeedManaged()) {
                    // getCleanTakeOffSpeed is a final fallback and not truth to reality
                    const speed = isFinite(this.v2Speed) ? this.v2Speed + 10 : this.getCleanTakeOffSpeed();
                    this.setAPManagedSpeed(speed, Aircraft.A320_NEO);
                }

                //This breaks everything, not sure why (from 1.8.3 update)
                /* let altitude = Simplane.getAltitudeAboveGround();
                let n1 = 100;
                if (altitude < this.thrustReductionAltitude) {
                    n1 = this.getThrustTakeOffLimit() / 100;
                }
                else {
                    n1 = this.getThrustClimbLimit() / 100;
                }
                SimVar.SetSimVarValue("AUTOPILOT THROTTLE MAX THRUST", "number", n1); */

            }
            else if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CLIMB) {
                if (this.isAirspeedManaged()) {
                    let speed = this.getClbManagedSpeed();
                    this.setAPManagedSpeed(speed, Aircraft.A320_NEO);
                }
            }
            else if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CRUISE) {
                if (this.isAirspeedManaged()) {
                    let speed = this.getCrzManagedSpeed();
                    this.setAPManagedSpeed(speed, Aircraft.A320_NEO);
                }
                if (this.isAltitudeManaged()) {
                }
                /* let altitude = Simplane.getAltitudeAboveGround();
                let n1 = 100;
                if (altitude < this.thrustReductionAltitude) {
                    n1 = this.getThrustTakeOffLimit() / 100;
                }
                else {
                    n1 = this.getThrustClimbLimit() / 100;
                }
                SimVar.SetSimVarValue("AUTOPILOT THROTTLE MAX THRUST", "number", n1); */
            }
            else if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_DESCENT) {
                if (this.isAirspeedManaged()) {
                    let speed = this.getDesManagedSpeed();
                    this.setAPManagedSpeed(speed, Aircraft.A320_NEO);
                }
            }
            else if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_APPROACH) {
                if (this.isAirspeedManaged()) {
                    let speed = this.getManagedApproachSpeed();
                    this.setAPManagedSpeed(speed, Aircraft.A320_NEO);
                }
            }
            this.updateAutopilotCooldown = this._apCooldown;
        }
    }
    checkUpdateFlightPhase() {
        const airSpeed = SimVar.GetSimVarValue("AIRSPEED TRUE", "knots");
        const leftThrottleDetent = Simplane.getEngineThrottleMode(0);
        const rightThrottleDetent = Simplane.getEngineThrottleMode(1);
        const highestThrottleDetent = (leftThrottleDetent >= rightThrottleDetent) ? leftThrottleDetent : rightThrottleDetent;



        //End preflight when takeoff power is applied and engines are running
        if (this.currentFlightPhase <= 2) {
            if ((highestThrottleDetent == ThrottleMode.TOGA || highestThrottleDetent == ThrottleMode.FLEX_MCT) && SimVar.GetSimVarValue("ENG N1 RPM:1", "Percent") > 15 && SimVar.GetSimVarValue("ENG N1 RPM:2", "Percent") > 15) {
                SimVar.SetSimVarValue("L:A32NX_Preflight_Complete", "Bool", 1);
            }
        }

        //Reset to preflight in case of RTO
        if (this.currentFlightPhase <= 2 && SimVar.GetSimVarValue("L:A32NX_Preflight_Complete", "Bool") == 1) {
            if (!(highestThrottleDetent == ThrottleMode.TOGA || highestThrottleDetent == ThrottleMode.FLEX_MCT) && SimVar.GetSimVarValue("RADIO HEIGHT", "Feet") < 100) {
                SimVar.SetSimVarValue("L:A32NX_Preflight_Complete", "Bool", 0);
                this.climbTransitionGroundAltitude = null;
            }
        }
        //Changes to climb phase when acceleration altitude is reached
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_TAKEOFF && airSpeed > 80) {
            const planeAltitudeMsl = Simplane.getAltitude();
            let accelerationAltitudeMsl = (this.accelerationAltitude || this.thrustReductionAltitude);

            if (!accelerationAltitudeMsl) {
                if (!this.climbTransitionGroundAltitude) {
                    const origin = this.flightPlanManager.getOrigin();
                    if (origin) {
                        this.climbTransitionGroundAltitude = origin.altitudeinFP;
                    }

                    if (!this.climbTransitionGroundAltitude) {
                        this.climbTransitionGroundAltitude = (parseInt(SimVar.GetSimVarValue("GROUND ALTITUDE", "feet")) || 0);
                    }
                }

                accelerationAltitudeMsl = this.climbTransitionGroundAltitude + 1500;
            }

            if (planeAltitudeMsl > accelerationAltitudeMsl) {
                console.log('switching to FLIGHT_PHASE_CLIMB: ' + JSON.stringify({planeAltitudeMsl, accelerationAltitudeMsl, prevPhase: this.currentFlightPhase}, null, 2));
                this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_CLIMB;
                this.climbTransitionGroundAltitude = null;
            }
        }
        //Default Asobo logic
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CLIMB) {
            const altitude = SimVar.GetSimVarValue("PLANE ALTITUDE", "feets");
            const cruiseFlightLevel = this.cruiseFlightLevel * 100;
            if (isFinite(cruiseFlightLevel)) {
                if (altitude >= 0.96 * cruiseFlightLevel) {
                    console.log('switching to FLIGHT_PHASE_CRUISE: ' + JSON.stringify({altitude, cruiseFlightLevel, prevPhase: this.currentFlightPhase}, null, 2));
                    this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_CRUISE;
                    Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO);
                }
            }
        }
        //(Mostly) Default Asobo logic
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CRUISE) {
            const altitude = SimVar.GetSimVarValue("PLANE ALTITUDE", "feets");
            const cruiseFlightLevel = this.cruiseFlightLevel * 100;
            if (isFinite(cruiseFlightLevel)) {
                if (altitude < 0.94 * cruiseFlightLevel) {
                    console.log('switching to FLIGHT_PHASE_DESCENT: ' + JSON.stringify({altitude, cruiseFlightLevel, prevPhase: this.currentFlightPhase}, null, 2));
                    this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_DESCENT;
                    Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO);
                }
            }
        }
        //Default Asobo logic
        // Switches from any phase to APPR if less than 40 distance(?) from DEST
        if (this.flightPlanManager.getActiveWaypoint() === this.flightPlanManager.getDestination()) {
            if (SimVar.GetSimVarValue("L:FLIGHTPLAN_USE_DECEL_WAYPOINT", "number") != 1) {
                const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                const planeLla = new LatLongAlt(lat, long);
                const dist = Avionics.Utils.computeGreatCircleDistance(planeLla, this.flightPlanManager.getDestination().infos.coordinates);
                if (dist < 40) {
                    this.connectIls();
                    this.flightPlanManager.activateApproach();
                    if (this.currentFlightPhase != FlightPhase.FLIGHT_PHASE_APPROACH) {
                        console.log('switching to tryGoInApproachPhase: ' + JSON.stringify({lat, long, dist, prevPhase: this.currentFlightPhase}, null, 2));
                        this.tryGoInApproachPhase();
                    }
                }
            }
        }
        //Default Asobo logic
        // Switches from any phase to APPR if less than 3 distance(?) from DECEL
        if (SimVar.GetSimVarValue("L:FLIGHTPLAN_USE_DECEL_WAYPOINT", "number") === 1) {
            if (this.currentFlightPhase != FlightPhase.FLIGHT_PHASE_APPROACH) {
                if (this.flightPlanManager.decelWaypoint) {
                    const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                    const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                    const planeLla = new LatLongAlt(lat, long);
                    const dist = Avionics.Utils.computeGreatCircleDistance(this.flightPlanManager.decelWaypoint.infos.coordinates, planeLla);
                    if (dist < 3) {
                        console.log('switching to tryGoInApproachPhase (AT DECEL): ' + JSON.stringify({lat, long, dist, prevPhase: this.currentFlightPhase}, null, 2));
                        console.log("Switching into approach. DECEL lat : " + lat + " long " + long);
                        this.tryGoInApproachPhase();
                    }
                }
            }
        }
        //Resets flight phase to preflight 30 seconds after touchdown
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_APPROACH && Simplane.getAltitudeAboveGround() < 1.5) {
            if (this.landingResetTimer == null) this.landingResetTimer = 30;
            if (this.lastPhaseUpdateTime == null) this.lastPhaseUpdateTime = Date.now();
            const deltaTime = Date.now() - this.lastPhaseUpdateTime;
            this.lastPhaseUpdateTime = Date.now();
            this.landingResetTimer -= deltaTime/1000;
            if (this.landingResetTimer <= 0) {
                this.landingResetTimer = null;
                this.currentFlightPhase = 2;
                SimVar.SetSimVarValue("L:A32NX_Preflight_Complete", "Bool", 0);
                SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_NORMAL", "Bool", 0);
                CDUIdentPage.ShowPage(this);
            }
        } else {
            //Reset timer to 30 when airborne in case of go around
            this.landingResetTimer = 30;
        }

        if (SimVar.GetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "number") != this.currentFlightPhase) {
            SimVar.SetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "number", this.currentFlightPhase);
            this.onFlightPhaseChanged();
            SimVar.SetSimVarValue("L:A32NX_CABIN_READY", "Bool", 0);
        }
    }
}
A320_Neo_CDU_MainDisplay._v1sConf1 = [
    [145, 149],
    [143, 151],
    [141, 152],
    [139, 150],
    [137, 147],
    [136, 145],
    [134, 143],
    [134, 142],
    [133, 142],
    [133, 143],
    [133, 144],
    [132, 145],
    [132, 146],
    [132, 146],
    [132, 147],
    [131, 148],
    [131, 148],
    [131, 149],
    [130, 150],
    [130, 150],
];
A320_Neo_CDU_MainDisplay._v1sConf2 = [
    [130, 156],
    [128, 154],
    [127, 151],
    [125, 149],
    [123, 147],
    [122, 145],
    [121, 143],
    [120, 143],
    [120, 143],
    [120, 142],
    [119, 142],
    [119, 142],
    [119, 142],
    [119, 141],
    [118, 141],
    [118, 141],
    [118, 140],
    [118, 140],
    [117, 140],
    [117, 140],
];
A320_Neo_CDU_MainDisplay._vRsConf1 = [
    [146, 160],
    [144, 160],
    [143, 159],
    [141, 158],
    [139, 156],
    [137, 154],
    [136, 152],
    [135, 151],
    [135, 151],
    [134, 151],
    [134, 151],
    [133, 151],
    [133, 151],
    [132, 150],
    [132, 151],
    [131, 151],
    [131, 150],
    [131, 150],
    [130, 151],
    [130, 150],
];
A320_Neo_CDU_MainDisplay._vRsConf2 = [
    [130, 158],
    [128, 156],
    [127, 154],
    [125, 152],
    [123, 150],
    [122, 148],
    [121, 147],
    [120, 146],
    [120, 146],
    [120, 145],
    [119, 145],
    [119, 144],
    [119, 144],
    [119, 143],
    [118, 143],
    [118, 142],
    [118, 142],
    [118, 141],
    [117, 141],
    [117, 140],
];
A320_Neo_CDU_MainDisplay._v2sConf1 = [
    [152, 165],
    [150, 165],
    [148, 164],
    [146, 163],
    [144, 161],
    [143, 159],
    [141, 157],
    [140, 156],
    [140, 156],
    [139, 156],
    [139, 155],
    [138, 155],
    [138, 155],
    [137, 155],
    [137, 155],
    [136, 155],
    [136, 155],
    [136, 155],
    [135, 155],
    [135, 155],
];
A320_Neo_CDU_MainDisplay._v2sConf2 = [
    [135, 163],
    [133, 160],
    [132, 158],
    [130, 157],
    [129, 155],
    [127, 153],
    [127, 151],
    [126, 150],
    [125, 150],
    [125, 149],
    [124, 149],
    [124, 148],
    [124, 148],
    [123, 147],
    [123, 146],
    [123, 146],
    [123, 145],
    [122, 145],
    [122, 144],
    [121, 144],
];
registerInstrument("a320-neo-cdu-main-display", A320_Neo_CDU_MainDisplay);
//# sourceMappingURL=A320_Neo_CDU_MainDisplay.js.map
