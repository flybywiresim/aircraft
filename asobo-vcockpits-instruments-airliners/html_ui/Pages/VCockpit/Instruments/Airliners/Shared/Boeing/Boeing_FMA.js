var Boeing;
(function (Boeing) {
    class FMA extends TemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
            this.allAnnunciations = new Array();
            this._aircraft = Aircraft.B747_8;
        }
        get templateID() {
            return "BoeingFMATemplate";
        }
        get aircraft() {
            return this._aircraft;
        }
        set aircraft(_val) {
            if (this._aircraft != _val) {
                this._aircraft = _val;
            }
        }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            if (this.allAnnunciations != null) {
                this.allAnnunciations.push(new Boeing_FMA.Column1Top(this, this.querySelector("#COL1_TOP"), this.querySelector("#COL1_TOP_HIGHLIGHT")));
                this.allAnnunciations.push(new Boeing_FMA.Column2Top(this, this.querySelector("#COL2_TOP"), this.querySelector("#COL2_TOP_HIGHLIGHT")));
                this.allAnnunciations.push(new Boeing_FMA.Column2Middle(this, this.querySelector("#COL2_MIDDLE"), null));
                this.allAnnunciations.push(new Boeing_FMA.Column2Bottom(this, this.querySelector("#COL2_BOTTOM"), null, this.querySelector("#COL2_BOTTOM_ARROWS")));
                this.allAnnunciations.push(new Boeing_FMA.Column3Top(this, this.querySelector("#COL3_TOP"), this.querySelector("#COL3_TOP_HIGHLIGHT")));
                this.allAnnunciations.push(new Boeing_FMA.Column3Middle(this, this.querySelector("#COL3_MIDDLE"), null));
            }
            this.isInitialised = true;
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
            Boeing_FMA.ApproachStatus.update(_deltaTime);
            if (this.allAnnunciations != null) {
                for (let i = 0; i < this.allAnnunciations.length; ++i) {
                    if (this.allAnnunciations[i] != null) {
                        this.allAnnunciations[i].update(_deltaTime);
                    }
                }
            }
        }
    }
    Boeing.FMA = FMA;
})(Boeing || (Boeing = {}));
var Boeing_FMA;
(function (Boeing_FMA) {
    class ApproachStatus {
        static get isFlareArmed() {
            return (this.flareState == 1);
        }
        static get isFlareActive() {
            return (this.flareState == 2);
        }
        static get isRolloutArmed() {
            return (this.rolloutState == 1);
        }
        static get isRolloutActive() {
            return (this.rolloutState == 2);
        }
        static update(_deltaTime) {
            this.flareState = 0;
            this.rolloutState = 0;
            if (Simplane.getCurrentFlightPhase() == FlightPhase.FLIGHT_PHASE_APPROACH) {
                const alt = Simplane.getAltitudeAboveGround();
                if (alt <= 1500) {
                    if (alt < 1.5) {
                        this.rolloutDelay += _deltaTime;
                        this.rolloutState = (this.rolloutDelay >= 1000) ? 2 : 1;
                    } else {
                        this.rolloutDelay = 0;
                        this.rolloutState = 1;
                    }
                    if (!this.isRolloutActive && Simplane.getAutoPilotActive()) {
                        this.flareState = (alt <= 60) ? 2 : 1;
                    }
                }
            }
        }
    }
    ApproachStatus.flareState = 0;
    ApproachStatus.rolloutState = 0;
    ApproachStatus.rolloutDelay = 0;
    Boeing_FMA.ApproachStatus = ApproachStatus;
    class Annunciation {
        constructor(_fma, _divElement, _highlightElement) {
            this.divElement = null;
            this.currentMode = -1;
            this.highlightElement = null;
            this.highlightTimer = 0;
            this.fma = _fma;
            this.divElement = _divElement;
            this.highlightElement = _highlightElement;
        }
        update(_deltaTime) {
            const mode = this.getActiveMode();
            if (mode != this.currentMode) {
                this.changeMode(mode);
            }
            this.updateHighlight(_deltaTime);
        }
        updateHighlight(_deltaTime) {
            if (this.highlightTimer > 0) {
                this.highlightTimer -= _deltaTime;
                if (this.highlightTimer <= 0) {
                    this.setHighlightVisibility(false);
                }
            }
        }
        changeMode(_mode) {
            this.currentMode = _mode;
            if (this.divElement != null) {
                this.divElement.innerHTML = "<span>" + this.getCurrentModeText() + "</span>";
            }
            this.setHighlightVisibility(this.currentMode >= 0);
        }
        setHighlightVisibility(_show) {
            if (this.highlightElement != null) {
                this.highlightElement.style.display = _show ? "block" : "none";
                if (_show) {
                    this.highlightTimer = Annunciation.HIGHLIGHT_LENGTH;
                }
            }
        }
    }
    Annunciation.HIGHLIGHT_LENGTH = 10 * 1000;
    Boeing_FMA.Annunciation = Annunciation;
    class Column1Top extends Annunciation {
        constructor() {
            super(...arguments);
            this.leftThrottleArmed = false;
            this.rightThrottleArmed = false;
        }
        update(_deltaTime) {
            const left = Simplane.getAutoPilotThrottleArmed(1);
            const right = Simplane.getAutoPilotThrottleArmed(2);
            const mode = this.getActiveMode();
            if ((mode != this.currentMode) || (left != this.leftThrottleArmed) || (right != this.rightThrottleArmed)) {
                this.leftThrottleArmed = left;
                this.rightThrottleArmed = right;
                this.changeMode(mode);
            }
            this.updateHighlight(_deltaTime);
        }
        getActiveMode() {
            if (!Simplane.getAutoPilotThrottleArmed()) {
                return -1;
            }
            if (this.fma.aircraft == Aircraft.AS01B) {
                if (SimVar.GetSimVarValue("L:AP_SPD_ACTIVE", "number") === 0) {
                    return -1;
                }
            }
            if (Simplane.getEngineThrottleMode(0) === ThrottleMode.TOGA) {
                return 4;
            }
            if (Simplane.getIndicatedSpeed() < 65) {
                return -1;
            }
            if (Simplane.getEngineThrottleMode(0) === ThrottleMode.IDLE) {
                return 1;
            }
            if (Simplane.getAutoPilotFLCActive() && Simplane.getAutopilotThrottle(1) < 30) {
                return 1;
            }
            if (Simplane.getAutoPilotFLCActive() && Simplane.getVerticalSpeed() > 100) {
                return 4;
            }
            if (Simplane.getEngineThrottleMode(0) === ThrottleMode.HOLD) {
                return 0;
            }
            if (SimVar.GetSimVarValue("L:AP_FLCH_ACTIVE", "number") === 1) {
                return 4;
            }
            if (SimVar.GetSimVarValue("L:AP_SPD_ACTIVE", "number") === 1) {
                return 2;
            }
            if (Simplane.getEngineThrottleMode(0) === ThrottleMode.CLIMB) {
                return 4;
            }
            if (SimVar.GetSimVarValue("L:AP_SPEED_INTERVENTION_ACTIVE", "number") === 1) {
                return 2;
            }
            if ((this.leftThrottleArmed || this.rightThrottleArmed) && Simplane.getAutoPilotThrottleActive()) {
                return 3;
            }
            return 4;
        }
        getCurrentModeText() {
            let modeText = "";
            if (this.leftThrottleArmed && !this.rightThrottleArmed) {
            } else if (!this.leftThrottleArmed && this.rightThrottleArmed) {
            }
            switch (this.currentMode) {
                case 0:
                    modeText += "HOLD";
                    break;
                case 1:
                    modeText += "IDLE";
                    break;
                case 2:
                    modeText += "SPD";
                    break;
                case 3:
                    modeText += "THR";
                    break;
                case 4:
                    modeText += "THR REF";
                    break;
                default: return "";
            }
            return modeText;
        }
    }
    Boeing_FMA.Column1Top = Column1Top;
    class Column2Top extends Annunciation {
        getActiveMode() {
            if (Simplane.getAutoPilotAPPRHold() && Simplane.getAutoPilotAPPRActive()) {
                if (Simplane.getAutoPilotApproachType() == 10) {
                    return 1;
                } else {
                    return 6;
                }
            }
            if (ApproachStatus.isRolloutActive) {
                return 7;
            }
            if (Simplane.getEngineThrottleMode(0) === ThrottleMode.TOGA) {
                return 8;
            }
            if (SimVar.GetSimVarValue("L:AP_LNAV_ACTIVE", "number") === 1) {
                return 5;
            }
            if (Simplane.getEngineThrottleMode(0) === ThrottleMode.HOLD && SimVar.GetSimVarValue("L:AP_LNAV_ARMED", "number") === 1) {
                return 8;
            }
            if (Simplane.getCurrentFlightPhase() === FlightPhase.FLIGHT_PHASE_TAKEOFF && Simplane.getAutoPilotThrottleArmed(1)) {
                return 8;
            }
            if (Simplane.getAutoPilotHeadingLockActive()) {
                if (SimVar.GetSimVarValue("L:AP_HEADING_HOLD_ACTIVE", "number") === 1) {
                    return 2;
                } else {
                    return 3;
                }
            }
            if (Simplane.getAutoPilotActive()) {
                if (Simplane.getAutoPilotHeadingLockActive()) {
                    if (this.fma.aircraft == Aircraft.B747_8) {
                        return 3;
                    } else {
                        return (Simplane.getAutoPilotTRKModeActive() ? 10 : 3);
                    }
                } else {
                    if (this.fma.aircraft == Aircraft.B747_8) {
                        return 2;
                    } else {
                        return (Simplane.getAutoPilotTRKModeActive() ? 9 : 2);
                    }
                }
            }
            if (this.fma.aircraft == Aircraft.AS01B) {
            }
            if (this.fma.aircraft == Aircraft.B747_8) {
            }
            return -1;
        }
        getCurrentModeText() {
            switch (this.currentMode) {
                case 0: return "B/CRS";
                case 1: return "FAC";
                case 2: return "HDG HOLD";
                case 3: return "HDG SEL";
                case 4: return "HUD TO/GA";
                case 5: return "LNAV";
                case 6: return "LOC";
                case 7: return "ROLLOUT";
                case 8: return "TO/GA";
                case 9: return "TRK HOLD";
                case 10: return "TRK SEL";
                case 11: return "ATT";
                default: return "";
            }
        }
    }
    Boeing_FMA.Column2Top = Column2Top;
    class Column2Middle extends Annunciation {
        getActiveMode() {
            if (Simplane.getAutoPilotAPPRHold() && Simplane.getAutoPilotAPPRArm()) {
                if (Simplane.getAutoPilotApproachType() == 10) {
                    return 1;
                } else {
                    return 3;
                }
            }
            if (SimVar.GetSimVarValue("L:AP_LNAV_ARMED", "number") === 1 && SimVar.GetSimVarValue("L:AP_LNAV_ACTIVE", "number") === 0) {
                return 2;
            }
            if (ApproachStatus.isRolloutArmed) {
                return 4;
            }
            return -1;
        }
        getCurrentModeText() {
            switch (this.currentMode) {
                case 0: return "B/CRS";
                case 1: return "FAC";
                case 2: return "LNAV";
                case 3: return "LOC";
                case 4: return "ROLLOUT";
                default: return "";
            }
        }
    }
    Boeing_FMA.Column2Middle = Column2Middle;
    class Column2Bottom extends Annunciation {
        constructor(_parent, _divElement, _highlightElement, _arrowsElement) {
            super(_parent, _divElement, _highlightElement);
            this.arrowsElement = null;
            this.arrowsElement = _arrowsElement;
        }
        changeMode(_mode) {
            super.changeMode(_mode);
            if (this.divElement != null) {
                let className = "bottom";
                if (_mode == 4) {
                    className += " warning";
                }
                this.divElement.className = className;
            }
            if (this.arrowsElement != null) {
                this.arrowsElement.style.display = (_mode == 3) ? "block" : "none";
            }
        }
        getActiveMode() {
            if (Simplane.getAutoPilotActive()) {
                return 0;
            } else if (Simplane.getAutoPilotFlightDirectorActive(1)) {
                return 1;
            }
            return -1;
        }
        getCurrentModeText() {
            switch (this.currentMode) {
                case 0: return ((this.fma.aircraft == Aircraft.B747_8) ? "CMD" : "A/P");
                case 1: return ((this.fma.aircraft == Aircraft.B747_8) ? "FD" : "FLT DIR");
                case 2: return "LAND 3";
                case 3: return "LAND 2";
                case 4: return "NO AUTOLAND";
                default: return "";
            }
        }
    }
    Boeing_FMA.Column2Bottom = Column2Bottom;
    class Column3Top extends Annunciation {
        getActiveMode() {
            if (Simplane.getAutoPilotAPPRHold() && Simplane.getAutoPilotGlideslopeHold() && Simplane.getAutoPilotGlideslopeActive() && Simplane.getAutoPilotAPPRActive()) {
                if (Simplane.getAutoPilotApproachType() == 10) {
                    return 5;
                } else {
                    return 4;
                }
            }
            if (Simplane.getEngineThrottleMode(0) === ThrottleMode.TOGA) {
                return 6;
            }
            if (SimVar.GetSimVarValue("L:AP_VNAV_ACTIVE", "number") === 1) {
                if (Simplane.getAutoPilotAltitudeLockActive()) {
                    const altitude = Simplane.getAltitude();
                    if (altitude > SimVar.GetSimVarValue("L:AIRLINER_CRUISE_ALTITUDE", "number") + 100) {
                        return 9;
                    }
                    return 7;
                }
                return 8;
            }
            if (Simplane.getEngineThrottleMode(0) === ThrottleMode.HOLD && SimVar.GetSimVarValue("L:AP_VNAV_ARMED", "number") === 1) {
                return 6;
            }
            if (Simplane.getCurrentFlightPhase() === FlightPhase.FLIGHT_PHASE_TAKEOFF && Simplane.getAutoPilotThrottleArmed(1)) {
                return 6;
            }
            if (SimVar.GetSimVarValue("L:AP_FLCH_ACTIVE", "number") === 1) {
                return 2;
            }
            if (SimVar.GetSimVarValue("L:AP_ALT_HOLD_ACTIVE", "number") === 1) {
                return 0;
            }
            if (ApproachStatus.isFlareActive) {
                return 1;
            }
            if (Simplane.getAutoPilotActive()) {
                if (Simplane.getAutoPilotAltitudeLockActive()) {
                    return 0;
                } else if (Simplane.getAutoPilotVerticalSpeedHoldActive()) {
                    if (this.fma.aircraft == Aircraft.B747_8) {
                        return 10;
                    } else {
                        return (Simplane.getAutoPilotFPAModeActive() ? 3 : 10);
                    }
                }
            }
            return -1;
        }
        getCurrentModeText() {
            switch (this.currentMode) {
                case 0: return "ALT";
                case 1: return "FLARE";
                case 2: return "FLCH SPD";
                case 3: return "FPA";
                case 4: return "G/S";
                case 5: return "G/P";
                case 6: return "TO/GA";
                case 7: return "VNAV PTH";
                case 8: return "VNAV SPD";
                case 9: return "VNAV ALT";
                case 10: return "V/S";
                default: return "";
            }
        }
    }
    Boeing_FMA.Column3Top = Column3Top;
    class Column3Middle extends Annunciation {
        getActiveMode() {
            if (Simplane.getAutoPilotAPPRHold() && Simplane.getAutoPilotGlideslopeHold() && !(Simplane.getAutoPilotGlideslopeActive() && Simplane.getAutoPilotAPPRActive())) {
                if (Simplane.getAutoPilotApproachType() == 10) {
                    return 1;
                } else {
                    return 2;
                }
            }
            if (SimVar.GetSimVarValue("L:AP_VNAV_ARMED", "number") === 1 && SimVar.GetSimVarValue("L:AP_VNAV_ACTIVE", "number") === 0) {
                return 3;
            }
            if (ApproachStatus.isFlareArmed) {
                return 0;
            }
            return -1;
        }
        getCurrentModeText() {
            switch (this.currentMode) {
                case 0: return "FLARE";
                case 1: return "G/P";
                case 2: return "G/S";
                case 3: return "VNAV";
                default: return "";
            }
        }
    }
    Boeing_FMA.Column3Middle = Column3Middle;
})(Boeing_FMA || (Boeing_FMA = {}));
customElements.define("boeing-fma", Boeing.FMA);
//# sourceMappingURL=Boeing_FMA.js.map