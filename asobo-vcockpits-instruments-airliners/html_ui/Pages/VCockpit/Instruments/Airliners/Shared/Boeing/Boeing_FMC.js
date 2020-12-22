class Boeing_FMC extends FMCMainDisplay {
    constructor() {
        super(...arguments);
        this._forceNextAltitudeUpdate = false;
        this._lastTargetAirspeed = 200;
        this._isLNAVActive = false;
        this._pendingLNAVActivation = false;
        this._isVNAVActive = false;
        this._pendingVNAVActivation = false;
        this._isFLCHActive = false;
        this._pendingFLCHActivation = false;
        this._isSPDActive = false;
        this._pendingSPDActivation = false;
        this._isSpeedInterventionActive = false;
        this._isHeadingHoldActive = false;
        this._headingHoldValue = 0;
        this._pendingHeadingSelActivation = false;
        this._isVSpeedActive = false;
        this._isAltitudeHoldActive = false;
        this._altitudeHoldValue = 0;
        this._onAltitudeHoldDeactivate = EmptyCallback.Void;
        this._isRouteActivated = false;
    }
    Init() {
        super.Init();
        this.maxCruiseFL = 450;
        this.cruiseFlightLevel = 100;
        this.onExec = () => {
            if (this.getIsRouteActivated()) {
                this.insertTemporaryFlightPlan();
                this._isRouteActivated = false;
                SimVar.SetSimVarValue("L:FMC_EXEC_ACTIVE", "number", 0);
                if (this.refreshPageCallback) {
                    this.refreshPageCallback();
                }
            }
        };
        this.onDel = () => {
            if (this.inOut.length === 0) {
                this.inOut = "DELETE";
            }
        };
        this.onClr = () => {
            if (this.isDisplayingErrorMessage) {
                this.inOut = this.lastUserInput;
                this.isDisplayingErrorMessage = false;
            }
            else if (this.inOut.length > 0) {
                if (this.inOut === "DELETE") {
                    this.inOut = "";
                }
                else {
                    this.inOut = this.inOut.substr(0, this.inOut.length - 1);
                }
            }
        };
        let flapAngles = [0, 1, 5, 10, 15, 17, 18, 20, 25, 30];
        let flapIndex = Simplane.getFlapsHandleIndex(true);
        if (flapIndex >= 1) {
            this._takeOffFlap = flapAngles[flapIndex];
        }
    }
    onEvent(_event) {
        super.onEvent(_event);
        console.log("B747_8_FMC_MainDisplay onEvent " + _event);
        if (_event.indexOf("AP_LNAV") != -1) {
            this.toggleLNAV();
        }
        else if (_event.indexOf("AP_VNAV") != -1) {
            this.toggleVNAV();
        }
        else if (_event.indexOf("AP_FLCH") != -1) {
            this.toggleFLCH();
        }
        else if (_event.indexOf("AP_HEADING_HOLD") != -1) {
            this.toggleHeadingHold();
        }
        else if (_event.indexOf("AP_HEADING_SEL") != -1) {
            this.activateHeadingSel();
        }
        else if (_event.indexOf("AP_SPD") != -1) {
            if (this.aircraftType === Aircraft.AS01B) {
                if (SimVar.GetSimVarValue("AUTOPILOT THROTTLE ARM", "Bool")) {
                    this.activateSPD();
                }
                else {
                    this.deactivateSPD();
                }
            }
            else {
                if ((this.getIsAltitudeHoldActive() || this.getIsVSpeedActive()) && this.getIsTHRActive()) {
                    this.toggleSPD();
                }
            }
        }
        else if (_event.indexOf("AP_SPEED_INTERVENTION") != -1) {
            this.toggleSpeedIntervention();
        }
        else if (_event.indexOf("AP_VSPEED") != -1) {
            this.toggleVSpeed();
        }
        else if (_event.indexOf("AP_ALT_INTERVENTION") != -1) {
            this.activateAltitudeSel();
        }
        else if (_event.indexOf("AP_ALT_HOLD") != -1) {
            this.toggleAltitudeHold();
        }
        else if (_event.indexOf("THROTTLE_TO_GA") != -1) {
            this.setAPSpeedHoldMode();
            if (this.aircraftType == Aircraft.AS01B)
                this.deactivateSPD();
            this.setThrottleMode(ThrottleMode.TOGA);
            if (Simplane.getIndicatedSpeed() > 80) {
                this.deactivateLNAV();
                this.deactivateVNAV();
            }
        }
        else if (_event.indexOf("EXEC") != -1) {
            this.onExec();
        }
    }
    getIsLNAVArmed() {
        return this._pendingLNAVActivation;
    }
    getIsLNAVActive() {
        return this._isLNAVActive;
    }
    toggleLNAV() {
        if (this.getIsLNAVArmed()) {
            this.deactivateLNAV();
        }
        else {
            this.activateLNAV();
        }
    }
    activateLNAV() {
        if (this.flightPlanManager.getWaypointsCount() === 0) {
            return;
        }
        SimVar.SetSimVarValue("L:AP_LNAV_ARMED", "number", 1);
        let altitude = Simplane.getAltitudeAboveGround();
        if (altitude < 50) {
            this._pendingLNAVActivation = true;
        }
        else {
            this.doActivateLNAV();
        }
        this.deactivateHeadingHold();
    }
    doActivateLNAV() {
        this._isLNAVActive = true;
        this._pendingLNAVActivation = false;
        if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "boolean")) {
            return;
        }
        SimVar.SetSimVarValue("L:AP_LNAV_ACTIVE", "number", 1);
        SimVar.SetSimVarValue("K:AP_NAV1_HOLD_ON", "number", 1);
    }
    deactivateLNAV() {
        this._pendingLNAVActivation = false;
        this._isLNAVActive = false;
        SimVar.SetSimVarValue("L:AP_LNAV_ARMED", "number", 0);
        SimVar.SetSimVarValue("L:AP_LNAV_ACTIVE", "number", 0);
    }
    getIsVNAVArmed() {
        return this._pendingVNAVActivation;
    }
    getIsVNAVActive() {
        return this._isVNAVActive;
    }
    toggleVNAV() {
        if (this.getIsVNAVArmed()) {
            this.deactivateVNAV();
            SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
            SimVar.SetSimVarValue("K:SPEED_SLOT_INDEX_SET", "number", 1);
        }
        else {
            this.activateVNAV();
        }
    }
    activateVNAV() {
        if (this.flightPlanManager.getWaypointsCount() === 0) {
            return;
        }
        SimVar.SetSimVarValue("L:AP_VNAV_ARMED", "number", 1);
        let altitude = Simplane.getAltitudeAboveGround();
        if (altitude < 400) {
            this._pendingVNAVActivation = true;
        }
        else {
            this.doActivateVNAV();
        }
        this.deactivateAltitudeHold();
        this.deactivateFLCH();
        this.deactivateVSpeed();
        if (this.aircraftType != Aircraft.AS01B)
            this.deactivateSPD();
    }
    doActivateVNAV() {
        this._isVNAVActive = true;
        SimVar.SetSimVarValue("L:AP_VNAV_ACTIVE", "number", 1);
        SimVar.SetSimVarValue("K:FLIGHT_LEVEL_CHANGE_ON", "Number", 1);
        this._pendingVNAVActivation = false;
        this.activateTHRREFMode();
        SimVar.SetSimVarValue("K:SPEED_SLOT_INDEX_SET", "number", 2);
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
        if (this.aircraftType == Aircraft.AS01B)
            this.activateSPD();
        this.setThrottleMode(ThrottleMode.CLIMB);
    }
    setThrottleMode(_mode) {
        if (this.getIsSPDActive() && this.aircraftType == Aircraft.AS01B)
            Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO);
        else
            Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", _mode);
    }
    deactivateVNAV() {
        this._pendingVNAVActivation = false;
        this._isVNAVActive = false;
        this._pendingVNAVActivation = false;
        SimVar.SetSimVarValue("L:AP_VNAV_ARMED", "number", 0);
        SimVar.SetSimVarValue("L:AP_VNAV_ACTIVE", "number", 0);
        this.deactivateSpeedIntervention();
    }
    getIsFLCHArmed() {
        return this._pendingFLCHActivation;
    }
    getIsFLCHActive() {
        return this._isFLCHActive;
    }
    toggleFLCH() {
        if (this.getIsFLCHArmed()) {
            this.deactivateFLCH();
        }
        else {
            this.activateFLCH();
        }
    }
    activateFLCH() {
        this._isFLCHActive = true;
        SimVar.SetSimVarValue("L:AP_FLCH_ACTIVE", "number", 1);
        this.deactivateVNAV();
        this.deactivateAltitudeHold();
        this.deactivateVSpeed();
        let altitude = Simplane.getAltitudeAboveGround();
        if (altitude < 400) {
            this._pendingFLCHActivation = true;
        }
        else {
            this.doActivateFLCH();
        }
    }
    doActivateFLCH() {
        this._pendingFLCHActivation = false;
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
        let displayedAltitude = Simplane.getAutoPilotDisplayedAltitudeLockValue();
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 1, displayedAltitude, this._forceNextAltitudeUpdate);
        if (!Simplane.getAutoPilotFLCActive()) {
            SimVar.SetSimVarValue("K:FLIGHT_LEVEL_CHANGE_ON", "Number", 1);
        }
        SimVar.SetSimVarValue("K:SPEED_SLOT_INDEX_SET", "number", 1);
        this.setThrottleMode(ThrottleMode.CLIMB);
        if (this.aircraftType != Aircraft.AS01B) {
            this.activateSPD();
        }
    }
    deactivateFLCH() {
        this._isFLCHActive = false;
        this._pendingFLCHActivation = false;
        SimVar.SetSimVarValue("L:AP_FLCH_ACTIVE", "number", 0);
        this.deactivateSpeedIntervention();
    }
    getIsSPDArmed() {
        return this._pendingSPDActivation;
    }
    getIsSPDActive() {
        return this._isSPDActive;
    }
    toggleSPD() {
        if (this.getIsSPDArmed()) {
            this.deactivateSPD();
        }
        else {
            this.activateSPD();
        }
    }
    activateSPD() {
        if (this.getIsVNAVActive() && this.aircraftType != Aircraft.AS01B) {
            return;
        }
        let altitude = Simplane.getAltitudeAboveGround();
        if (altitude < 400) {
            this._pendingSPDActivation = true;
        }
        else {
            this.doActivateSPD();
        }
        SimVar.SetSimVarValue("L:AP_SPD_ACTIVE", "number", 1);
        this._isSPDActive = true;
    }
    doActivateSPD() {
        this._pendingSPDActivation = false;
        if (Simplane.getAutoPilotMachModeActive()) {
            let currentMach = Simplane.getAutoPilotMachHoldValue();
            Coherent.call("AP_MACH_VAR_SET", 1, currentMach);
            SimVar.SetSimVarValue("K:AP_MANAGED_SPEED_IN_MACH_ON", "number", 1);
        }
        else {
            let currentSpeed = Simplane.getAutoPilotAirspeedHoldValue();
            Coherent.call("AP_SPD_VAR_SET", 1, currentSpeed);
            SimVar.SetSimVarValue("K:AP_MANAGED_SPEED_IN_MACH_OFF", "number", 1);
        }
        if (!this._isFLCHActive) {
            this.setAPSpeedHoldMode();
        }
        this.setThrottleMode(ThrottleMode.AUTO);
        let stayManagedSpeed = (this._pendingVNAVActivation || this._isVNAVActive) && !this._isSpeedInterventionActive;
        if (!stayManagedSpeed) {
            SimVar.SetSimVarValue("K:SPEED_SLOT_INDEX_SET", "number", 1);
        }
    }
    deactivateSPD() {
        SimVar.SetSimVarValue("L:AP_SPD_ACTIVE", "number", 0);
        this._isSPDActive = false;
        this._pendingSPDActivation = false;
    }
    getIsSpeedInterventionActive() {
        return this._isSpeedInterventionActive;
    }
    toggleSpeedIntervention() {
        if (this.getIsSpeedInterventionActive()) {
            this.deactivateSpeedIntervention();
        }
        else {
            this.activateSpeedIntervention();
        }
    }
    activateSpeedIntervention() {
        if (!this.getIsVNAVActive()) {
            return;
        }
        this._isSpeedInterventionActive = true;
        if (Simplane.getAutoPilotMachModeActive()) {
            let currentMach = Simplane.getAutoPilotMachHoldValue();
            Coherent.call("AP_MACH_VAR_SET", 1, currentMach);
        }
        else {
            let currentSpeed = Simplane.getAutoPilotAirspeedHoldValue();
            Coherent.call("AP_SPD_VAR_SET", 1, currentSpeed);
        }
        SimVar.SetSimVarValue("L:AP_SPEED_INTERVENTION_ACTIVE", "number", 1);
        SimVar.SetSimVarValue("K:SPEED_SLOT_INDEX_SET", "number", 1);
        if (this.aircraftType == Aircraft.AS01B)
            this.activateSPD();
    }
    deactivateSpeedIntervention() {
        this._isSpeedInterventionActive = false;
        SimVar.SetSimVarValue("L:AP_SPEED_INTERVENTION_ACTIVE", "number", 0);
        if (this.getIsVNAVActive()) {
            SimVar.SetSimVarValue("K:SPEED_SLOT_INDEX_SET", "number", 2);
        }
    }
    activateTHRREFMode() {
        let altitude = Simplane.getAltitudeAboveGround();
        this.setThrottleMode(ThrottleMode.CLIMB);
        let n1 = 100;
        if (altitude < this.thrustReductionAltitude) {
            n1 = this.getThrustTakeOffLimit();
        }
        else {
            n1 = this.getThrustClimbLimit();
        }
        SimVar.SetSimVarValue("AUTOPILOT THROTTLE MAX THRUST", "number", n1);
    }
    getIsHeadingHoldActive() {
        return this._isHeadingHoldActive;
    }
    toggleHeadingHold() {
        if (this.getIsHeadingHoldActive()) {
            let altitude = Simplane.getAltitudeAboveGround();
            if (altitude < 50) {
                this.deactivateHeadingHold();
            }
            else {
                this.activateHeadingHold();
            }
        }
        else {
            this.activateHeadingHold();
        }
    }
    activateHeadingHold() {
        this.deactivateLNAV();
        this._isHeadingHoldActive = true;
        if (!SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean")) {
            SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "Number", 1);
        }
        SimVar.SetSimVarValue("L:AP_HEADING_HOLD_ACTIVE", "number", 1);
        this._headingHoldValue = Simplane.getHeadingMagnetic();
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 2);
        Coherent.call("HEADING_BUG_SET", 2, this._headingHoldValue);
    }
    deactivateHeadingHold() {
        this._isHeadingHoldActive = false;
        SimVar.SetSimVarValue("L:AP_HEADING_HOLD_ACTIVE", "number", 0);
    }
    activateHeadingSel() {
        this.deactivateHeadingHold();
        this.deactivateLNAV();
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
        let altitude = Simplane.getAltitudeAboveGround();
        if (altitude < 400) {
            this._pendingHeadingSelActivation = true;
        }
        else {
            this.doActivateHeadingSel();
        }
    }
    doActivateHeadingSel() {
        this._pendingHeadingSelActivation = false;
        if (!SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean")) {
            SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "Number", 1);
        }
    }
    getIsTHRActive() {
        return false;
    }
    getIsVSpeedActive() {
        return this._isVSpeedActive;
    }
    toggleVSpeed() {
        if (this.getIsVSpeedActive()) {
            let altitude = Simplane.getAltitudeAboveGround();
            if (altitude < 50) {
                this.deactivateVSpeed();
                this.deactivateSPD();
            }
            else {
                this.activateVSpeed();
            }
        }
        else {
            this.activateVSpeed();
        }
    }
    activateVSpeed() {
        this._isVSpeedActive = true;
        this.deactivateVNAV();
        this.deactivateAltitudeHold();
        this.deactivateFLCH();
        this.activateSPD();
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
        let displayedAltitude = Simplane.getAutoPilotDisplayedAltitudeLockValue();
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 1, displayedAltitude, this._forceNextAltitudeUpdate);
        setTimeout(() => {
            let currentVSpeed = Simplane.getVerticalSpeed();
            Coherent.call("AP_VS_VAR_SET_ENGLISH", 0, currentVSpeed);
            if (!SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
                SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "Number", 1);
            }
        }, 200);
        SimVar.SetSimVarValue("L:AP_VS_ACTIVE", "number", 1);
    }
    deactivateVSpeed() {
        this._isVSpeedActive = false;
        SimVar.SetSimVarValue("L:AP_VS_ACTIVE", "number", 0);
    }
    activateAltitudeSel() {
        if (this.getIsVNAVActive()) {
            let displayedAltitude = Simplane.getAutoPilotDisplayedAltitudeLockValue();
            this.cruiseFlightLevel = Math.floor(displayedAltitude / 100);
        }
    }
    toggleAltitudeHold() {
        if (this.getIsAltitudeHoldActive()) {
            let altitude = Simplane.getAltitudeAboveGround();
            if (altitude < 50) {
                this.deactivateAltitudeHold();
                this.deactivateSPD();
            }
        }
        else {
            this.activateAltitudeHold();
        }
    }
    getIsAltitudeHoldActive() {
        return this._isAltitudeHoldActive;
    }
    activateAltitudeHold(useCurrentAutopilotTarget = false) {
        this.deactivateVNAV();
        this.deactivateFLCH();
        this.deactivateVSpeed();
        this.activateSPD();
        this._isAltitudeHoldActive = true;
        SimVar.SetSimVarValue("L:AP_ALT_HOLD_ACTIVE", "number", 1);
        if (useCurrentAutopilotTarget) {
            this._altitudeHoldValue = Simplane.getAutoPilotAltitudeLockValue("feet");
        }
        else {
            this._altitudeHoldValue = Simplane.getAltitude();
            this._altitudeHoldValue = Math.round(this._altitudeHoldValue / 100) * 100;
        }
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 1, this._altitudeHoldValue, this._forceNextAltitudeUpdate);
        if (!SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Boolean")) {
            SimVar.SetSimVarValue("K:AP_PANEL_ALTITUDE_HOLD", "Number", 1);
        }
    }
    deactivateAltitudeHold() {
        this._isAltitudeHoldActive = false;
        SimVar.SetSimVarValue("L:AP_ALT_HOLD_ACTIVE", "number", 0);
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 1, Simplane.getAutoPilotDisplayedAltitudeLockValue(), this._forceNextAltitudeUpdate);
        if (this._onAltitudeHoldDeactivate) {
            let cb = this._onAltitudeHoldDeactivate;
            this._onAltitudeHoldDeactivate = undefined;
            cb();
        }
    }
    getThrustTakeOffLimit() {
        return 100;
    }
    getThrustClimbLimit() {
        return 100;
    }
    getVRef(flapsHandleIndex = NaN, useCurrentWeight = true) {
        return 200;
    }
    getTakeOffManagedSpeed() {
        let altitude = Simplane.getAltitudeAboveGround();
        if (altitude < 35) {
            return this.v2Speed + 15;
        }
        return 250;
    }
    getIsRouteActivated() {
        return this._isRouteActivated;
    }
    activateRoute() {
        this._isRouteActivated = true;
        SimVar.SetSimVarValue("L:FMC_EXEC_ACTIVE", "number", 1);
    }
    setBoeingDirectTo(directToWaypointIdent, directToWaypointIndex, callback = EmptyCallback.Boolean) {
        let waypoints = this.flightPlanManager.getWaypoints();
        let waypointIndex = waypoints.findIndex(w => { return w.ident === directToWaypointIdent; });
        if (waypointIndex === -1) {
            waypoints = this.flightPlanManager.getApproachWaypoints();
            if (waypoints) {
                let waypoint = waypoints.find(w => { return w.ident === directToWaypointIdent; });
                if (waypoint) {
                    return this.flightPlanManager.activateDirectTo(waypoint.icao, () => {
                        return callback(true);
                    });
                }
            }
        }
        if (waypointIndex > -1) {
            this.setDepartureIndex(-1, () => {
                let i = directToWaypointIndex;
                let removeWaypointMethod = () => {
                    if (i < waypointIndex) {
                        console.log("Remove Waypoint " + this.flightPlanManager.getWaypoints()[directToWaypointIndex].ident);
                        this.flightPlanManager.removeWaypoint(directToWaypointIndex, false, () => {
                            i++;
                            removeWaypointMethod();
                        });
                    }
                    else {
                        callback(true);
                    }
                };
                removeWaypointMethod();
            });
        }
        else {
            callback(false);
        }
    }
}
//# sourceMappingURL=Boeing_FMC.js.map