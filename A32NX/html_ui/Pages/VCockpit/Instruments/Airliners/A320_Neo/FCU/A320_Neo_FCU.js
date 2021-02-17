class A320_Neo_FCU extends BaseAirliners {
    constructor() {
        super();
        this.initDuration = 3000;
    }
    get templateID() {
        return "A320_Neo_FCU";
    }
    connectedCallback() {
        super.connectedCallback();
        RegisterViewListener("JS_LISTENER_KEYEVENT", this.onListenerRegistered.bind(this));
        this.maxUpdateBudget = 12;
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onListenerRegistered() {
        this.mainPage = new A320_Neo_FCU_MainPage();
        this.pageGroups = [
            new NavSystemPageGroup("Main", this, [
                this.mainPage
            ]),
        ];
    }
    reboot() {
        super.reboot();
        this.mainPage.reboot();
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        this.updateMachTransition();
    }
    onEvent(_event) {
    }
    onFlightStart() {
        super.onFlightStart();
        if (this.mainPage) {
            this.mainPage.onFlightStart();
        }
    }
}

class A320_Neo_FCU_MainElement extends NavSystemElement {
    init(root) {
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
    }
    onEvent(_event) {
    }
}

class A320_Neo_FCU_MainPage extends NavSystemPage {
    constructor() {
        super("Main", "Mainframe", new A320_Neo_FCU_MainElement());
        this.largeScreen = new A320_Neo_FCU_LargeScreen();
        this.smallScreen = new A320_Neo_FCU_SmallScreen();
        this.element = new NavSystemElementGroup([
            this.largeScreen,
            this.smallScreen
        ]);
    }
    init() {
        super.init();
    }
    onEvent(_event) {
        this.largeScreen.onEvent(_event);
    }
    reboot() {
        this.largeScreen.reboot();
        this.smallScreen.reboot();
    }
    onFlightStart() {
        this.largeScreen.onFlightStart();
        this.smallScreen.onFlightStart();
    }
}

class A320_Neo_FCU_Component {
    getDivElement(_name) {
        if (this.divRef != null) {
            return this.divRef.querySelector("#" + _name);
        }
    }
    set textValueContent(_textContent) {
        if (this.textValue != null) {
            this.textValue.textContent = _textContent;
            this.textValue.innerHTML = this.textValue.innerHTML.replace("{sp}", "&nbsp;");
        }
    }
    getElement(_type, _name) {
        if (this.divRef != null) {
            const allText = this.divRef.getElementsByTagName(_type);
            if (allText != null) {
                for (let i = 0; i < allText.length; ++i) {
                    if (allText[i].id == _name) {
                        return allText[i];
                    }
                }
            }
        }
        return null;
    }
    getTextElement(_name) {
        return this.getElement("text", _name);
    }
    setTextElementActive(_text, _active) {
        if (_text != null) {
            _text.setAttribute("class", "Common " + (_active ? "Active" : "Inactive"));
        }
    }
    setElementVisibility(_element, _show) {
        if (_element != null) {
            _element.style.display = _show ? "block" : "none";
        }
    }
    constructor(_gps, _divName) {
        this.gps = _gps;
        this.divRef = _gps.getChildById(_divName);
        this.textValue = this.getTextElement("Value");
        this.init();
        this.update(0);
    }
    reboot() {
        this.init();
    }
    onFlightStart() {
    }
}

class A320_Neo_FCU_Speed extends A320_Neo_FCU_Component {
    constructor() {
        super(...arguments);
        this.isActive = false;
        this.isManaged = false;
        this.showSelectedSpeed = false;
        this.currentValue = 0;
    }
    init() {
        this.textSPD = this.getTextElement("SPD");
        this.textMACH = this.getTextElement("MACH");
        this.illuminator = this.getElement("circle", "Illuminator");
        this.refresh(false, false, false, false, 0, 0, true);
    }
    update(_deltaTime) {
        const showSelectedSpeed = SimVar.GetSimVarValue("L:A320_FCU_SHOW_SELECTED_SPEED", "number") === 1;
        const isManaged = Simplane.getAutoPilotAirspeedManaged();
        const isMachActive = Simplane.getAutoPilotMachModeActive();
        this.refresh(true, isManaged, showSelectedSpeed, isMachActive, (isMachActive) ? Simplane.getAutoPilotSelectedMachHoldValue() * 100 : Simplane.getAutoPilotSelectedAirspeedHoldValue(), SimVar.GetSimVarValue("L:XMLVAR_LTS_Test", "Bool"));
    }
    refresh(_isActive, _isManaged, _showSelectedSpeed, _machActive, _value, _lightsTest, _force = false) {
        if ((_isActive != this.isActive) || (_isManaged != this.isManaged) || (_showSelectedSpeed != this.showSelectedSpeed) || (_value != this.currentValue) || (_lightsTest !== this.lightsTest) || _force) {
            this.isActive = _isActive;
            this.isManaged = _isManaged;
            this.showSelectedSpeed = _showSelectedSpeed;
            this.currentValue = _value;
            this.setTextElementActive(this.textSPD, !_machActive);
            this.setTextElementActive(this.textMACH, _machActive);
            this.lightsTest = _lightsTest;
            if (this.lightsTest) {
                this.setElementVisibility(this.illuminator, true);
                this.textValueContent = ".8.8.8";
                this.setTextElementActive(this.textSPD, true);
                this.setTextElementActive(this.textMACH, true);
                return;
            }
            let value = Math.round(Math.max(this.currentValue, 0)).toString().padStart(3, "0");
            if (!this.isManaged) {
                if (_machActive) {
                    value = `${value.substring(0,1)}.${value.substring(1)}`;
                }
                this.textValueContent = value;
                this.setElementVisibility(this.illuminator, false);
            } else if (this.isManaged) {
                if (this.showSelectedSpeed) {
                    this.textValueContent = value;
                } else {
                    this.textValueContent = "---";
                }
            }
            this.setElementVisibility(this.illuminator, this.isManaged);
        }
    }
}

class A320_Neo_FCU_Heading extends A320_Neo_FCU_Component {
    constructor() {
        super(...arguments);
        this.backToIdleTimeout = 0;
        this.idleCountdown = 5; // in seconds
        this.trueAirspeedThreshold = 50; // in knots
        this.headingForTrackRecalculationPeriod = 1500; // in ms
    }
    init() {
        this.textHDG = this.getTextElement("HDG");
        this.textTRK = this.getTextElement("TRK");
        this.textLAT = this.getTextElement("LAT");
        this.illuminator = this.getElement("circle", "Illuminator");
        this.refresh(false, false, true, false, 0, 0, true);
    }
    onFlightStart() {
        super.onFlightStart();
        const showSelectedHeading = SimVar.GetSimVarValue("L:A320_FCU_SHOW_SELECTED_HEADING", "number") === 1;
        if (!showSelectedHeading) {
            const simHeading = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree");
            Coherent.call("HEADING_BUG_SET", 1, Math.round(simHeading));
        }
    }
    update(_deltaTime) {
        const isLateralModeActive = Simplane.getAutoPilotLateralModeActive();
        const isTRKMode = SimVar.GetSimVarValue("L:A32NX_TRK_FPA_MODE_ACTIVE", "Bool");
        let showSelectedHeading = SimVar.GetSimVarValue("L:A320_FCU_SHOW_SELECTED_HEADING", "number") === 1;
        if (SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE HOLD", "boolean")) {
            showSelectedHeading = false;
        }
        const isManaged = Simplane.getAutoPilotHeadingManaged() || SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "boolean");
        if (isManaged && this.backToIdleTimeout > 0) {
            this.backToIdleTimeout -= _deltaTime / 1000;
            if (this.backToIdleTimeout <= 0) {
                SimVar.SetSimVarValue("L:A320_FCU_SHOW_SELECTED_HEADING", "number", 0);
                showSelectedHeading = false;
            }
        }
        const lightsTest = SimVar.GetSimVarValue("L:XMLVAR_LTS_Test", "Bool");
        if (isLateralModeActive) {
            this.refresh(false, isManaged, isTRKMode, showSelectedHeading, 0, lightsTest);
        } else if (isTRKMode) {
            const track = SimVar.GetSimVarValue("L:A32NX_AUTOPILOT_TRACK_SELECTED:1", "Degrees");
            if (!this.isManaged) {
                this.timeSinceHeadingForTrackRecalculation = (this.timeSinceHeadingForTrackRecalculation + _deltaTime) || 0;
                if (this.timeSinceHeadingForTrackRecalculation > this.headingForTrackRecalculationPeriod) {
                    const heading = this.calculateHeadingForTrack(track);
                    Coherent.call("HEADING_BUG_SET", 1, heading);
                    this.timeSinceHeadingForTrackRecalculation = 0;
                }
            }

            this.refresh(true, isManaged, true, showSelectedHeading, track, lightsTest);
        } else {
            this.refresh(true, isManaged, false, showSelectedHeading, Simplane.getAutoPilotSelectedHeadingLockValue(false), lightsTest);
        }
    }
    refresh(_isActive, _isManaged, _isTRKMode, _showSelectedHeading, _value, _lightsTest, _force = false) {
        if ((_isActive != this.isActive) || _isManaged != this.isManaged || (_isTRKMode != this.isTRKMode) || (_showSelectedHeading != this.showSelectedHeading) || (_value != this.currentValue) || (_lightsTest !== this.lightsTest) || _force) {
            if (_isTRKMode != this.isTRKMode) {
                this.onTRKModeChanged(_isTRKMode);
            }
            if (_isManaged != this.isManaged) {
                this.onManagedChanged(_isManaged);
            }
            if (_value != this.currentValue) {
                this.onValueChanged(_value);
            }
            if (_showSelectedHeading != this.showSelectedHeading) {
                this.onShowSelectedHeadingChanged(_showSelectedHeading);
            }
            this.isActive = _isActive;
            this.isManaged = _isManaged;
            this.isTRKMode = _isTRKMode;
            this.showSelectedHeading = _showSelectedHeading;
            this.currentValue = _value;
            this.setTextElementActive(this.textHDG, !this.isTRKMode);
            this.setTextElementActive(this.textTRK, this.isTRKMode);
            this.lightsTest = _lightsTest;
            if (this.lightsTest) {
                this.setTextElementActive(this.textHDG, true);
                this.setTextElementActive(this.textTRK, true);
                this.setTextElementActive(this.textLAT, true);
                this.textValueContent = ".8.8.8";
                this.setElementVisibility(this.illuminator, true);
                return;
            }
            if (!this.isManaged) {
                var value = Math.round(Math.max(this.currentValue, 0)) % 360;
                this.textValueContent = value.toString().padStart(3, "0");
            } else if (this.isManaged) {
                if (this.showSelectedHeading) {
                    var value = Math.round(Math.max(this.currentValue, 0)) % 360;
                    this.textValueContent = value.toString().padStart(3, "0");
                } else {
                    this.textValueContent = "---";
                }
            }
            this.setElementVisibility(this.illuminator, this.isManaged);
        }
    }
    /**
     * Calculates the corresponding track for a given heading, assuming it is flown in the current conditions (TAS + wind).
     * @param {number} _heading The heading in degrees.
     * @returns {number} The corresponding track in degrees.
     */
    calculateTrackForHeading(_heading) {
        const trueAirspeed = SimVar.GetSimVarValue("AIRSPEED TRUE", "Knots");
        if (trueAirspeed < 50) {
            return _heading;
        }

        const heading = _heading * Math.PI / 180;
        const windVelocity = SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "Knots");
        const windDirection = SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "Degrees") * Math.PI / 180;
        // https://web.archive.org/web/20160302090326/http://williams.best.vwh.net/avform.htm#Wind
        const wca = Math.atan2(windVelocity * Math.sin(heading - windDirection), trueAirspeed - windVelocity * Math.cos(heading - windDirection));
        const track = heading + wca % (2 * Math.PI);
        return (((track * 180 / Math.PI) % 360) + 360) % 360;
    }
    /**
     * Calculates the heading needed to fly a given track in the current conditions (TAS + wind).
     * @param {number} _track The track in degrees.
     * @returns {number} The corresponding heading in degrees.
     */
    calculateHeadingForTrack(_track) {
        const trueAirspeed = SimVar.GetSimVarValue("AIRSPEED TRUE", "Knots");
        if (trueAirspeed < 50) {
            return _track;
        }

        const track = _track * Math.PI / 180;
        const windVelocity = SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "Knots");
        const windDirection = SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "Degrees") * Math.PI / 180;
        // https://web.archive.org/web/20160302090326/http://williams.best.vwh.net/avform.htm#Wind
        const swc = (windVelocity / trueAirspeed) * Math.sin(windDirection - track);
        const heading = track + Math.asin(swc) % (2 * Math.PI);
        const _heading = (((heading * 180 / Math.PI) % 360) + 360) % 360;
        return _heading == NaN ? _track : _heading;
    }
    onTRKModeChanged(_newValue) {
        if (_newValue) {
            const heading = Simplane.getAutoPilotSelectedHeadingLockValue(false);
            const track = this.calculateTrackForHeading(heading);
            SimVar.SetSimVarValue("L:A32NX_AUTOPILOT_TRACK_SELECTED:1", "Degrees", track);
        }
    }
    onManagedChanged(_newValue) {
        const simHeading = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree");
        Coherent.call("HEADING_BUG_SET", 1, simHeading);
        SimVar.SetSimVarValue("L:A32NX_AUTOPILOT_TRACK_SELECTED:1", "Degrees", this.calculateTrackForHeading(simHeading));
        if (!_newValue) {
            this.backToIdleTimeout = 0;
        }
    }
    onValueChanged(_newValue) {
        if (this.isManaged && this.showSelectedHeading) {
            this.backToIdleTimeout = this.idleCountdown;
        }
    }
    onShowSelectedHeadingChanged(_newValue) {
        if (this.isManaged && _newValue) {
            this.backToIdleTimeout = this.idleCountdown;
        }
    }
    onEvent(_event) {
        // TODO: increments of more than 1 if rolling quickly.
        if (_event === "AP_INC_TRACK") {
            const currentTrack = Math.round(SimVar.GetSimVarValue("L:A32NX_AUTOPILOT_TRACK_SELECTED:1", "Degrees"));
            const newTrack = ((currentTrack + 1 % 360) + 360) % 360;
            SimVar.SetSimVarValue("L:A32NX_AUTOPILOT_TRACK_SELECTED:1", "Degrees", newTrack);
            SimVar.SetSimVarValue("L:A320_FCU_SHOW_SELECTED_HEADING", "number", 1);
            Coherent.call("HEADING_BUG_SET", 1, this.calculateHeadingForTrack(newTrack));
        } else if (_event === "AP_DEC_TRACK") {
            const currentTrack = Math.round(SimVar.GetSimVarValue("L:A32NX_AUTOPILOT_TRACK_SELECTED:1", "Degrees"));
            const newTrack = ((currentTrack - 1 % 360) + 360) % 360;
            SimVar.SetSimVarValue("L:A32NX_AUTOPILOT_TRACK_SELECTED:1", "Degrees", newTrack);
            SimVar.SetSimVarValue("L:A320_FCU_SHOW_SELECTED_HEADING", "number", 1);
            Coherent.call("HEADING_BUG_SET", 1, this.calculateHeadingForTrack(newTrack));
        } else if (_event === "MODE_MANAGED_HEADING" && this.isManaged) {
            this.backToIdleTimeout = 0;
        }
    }
}

class A320_Neo_FCU_Mode extends A320_Neo_FCU_Component {
    init() {
        this.textHDG = this.getTextElement("HDG");
        this.textVS = this.getTextElement("VS");
        this.textTRK = this.getTextElement("TRK");
        this.textFPA = this.getTextElement("FPA");
        this.refresh(false, 0, true);
    }
    update(_deltaTime) {
        const _isTRKFPADisplayMode = SimVar.GetSimVarValue("L:A32NX_TRK_FPA_MODE_ACTIVE", "Bool");
        this.refresh(_isTRKFPADisplayMode, SimVar.GetSimVarValue("L:XMLVAR_LTS_Test", "Bool"));
    }
    refresh(_isTRKFPADisplayMode, _lightsTest, _force = false) {
        if ((_isTRKFPADisplayMode != this.isTRKFPADisplayMode) || (_lightsTest !== this.lightsTest) || _force) {
            this.isTRKFPADisplayMode = _isTRKFPADisplayMode;
            this.lightsTest = _lightsTest;
            if (this.lightsTest) {
                this.setTextElementActive(this.textHDG, true);
                this.setTextElementActive(this.textVS, true);
                this.setTextElementActive(this.textTRK, true);
                this.setTextElementActive(this.textFPA, true);
                return;
            }
            this.setTextElementActive(this.textHDG, !this.isTRKFPADisplayMode);
            this.setTextElementActive(this.textVS, !this.isTRKFPADisplayMode);
            this.setTextElementActive(this.textTRK, this.isTRKFPADisplayMode);
            this.setTextElementActive(this.textFPA, this.isTRKFPADisplayMode);
        }
    }
}

class A320_Neo_FCU_Altitude extends A320_Neo_FCU_Component {
    init() {
        this.illuminator = this.getElement("circle", "Illuminator");
        this.isActive = false;
        this.isManaged = false;
        this.currentValue = 0;
        let initValue = Simplane.getAltitude();
        if (initValue <= 5000) {
            initValue = 5000;
        } else {
            initValue = Math.round(initValue / 100) * 100;
        }
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 1, initValue, true);
        this.refresh(false, false, initValue, 0, true);
    }
    reboot() {
        this.init();
    }
    update(_deltaTime) {
        this.refresh(Simplane.getAutoPilotActive(), Simplane.getAutoPilotAltitudeManaged(), Simplane.getAutoPilotDisplayedAltitudeLockValue(Simplane.getAutoPilotAltitudeLockUnits()), SimVar.GetSimVarValue("L:XMLVAR_LTS_Test", "Bool"));
    }
    refresh(_isActive, _isManaged, _value, _lightsTest, _force = false) {
        if ((_isActive != this.isActive) || (_isManaged != this.isManaged) || (_value != this.currentValue) || (_lightsTest !== this.lightsTest) || _force) {
            this.isActive = _isActive;
            this.isManaged = _isManaged;
            this.currentValue = _value;
            this.lightsTest = _lightsTest;
            if (this.lightsTest) {
                this.textValueContent = "88888";
                this.setElementVisibility(this.illuminator, true);
                return;
            }
            const value = Math.floor(Math.max(this.currentValue, 100));
            this.textValueContent = value.toString().padStart(5, "0");
            this.setElementVisibility(this.illuminator, this.isManaged);
            if (!_isManaged) {
                if ((Simplane.getAutoPilotAltitudeSelected() || Simplane.getAutoPilotAltitudeArmed()) && (Simplane.getAutoPilotFlightDirectorActive(1) || Simplane.getAutoPilotFlightDirectorActive(2)) && (Simplane.getAutoPilotActive(1) || Simplane.getAutoPilotActive(2))) {
                    const targetAltitude = Simplane.getAutoPilotAltitudeLockValue("feets");
                    const altitude = Simplane.getAltitude();
                    if (altitude > targetAltitude + 100 || altitude < targetAltitude - 100) {
                        if (!Simplane.getAutoPilotGlideslopeHold()) {
                            SimVar.SetSimVarValue("L:A320_NEO_FCU_FORCE_IDLE_VS", "Number", 1);
                        }
                        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 1, Simplane.getAutoPilotDisplayedAltitudeLockValue(), true);
                        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
                    }
                }
            }
        }
    }
}

var A320_Neo_FCU_VSpeed_State;
(function (A320_Neo_FCU_VSpeed_State) {
    A320_Neo_FCU_VSpeed_State[A320_Neo_FCU_VSpeed_State["Idle"] = 0] = "Idle";
    A320_Neo_FCU_VSpeed_State[A320_Neo_FCU_VSpeed_State["Zeroing"] = 1] = "Zeroing";
    A320_Neo_FCU_VSpeed_State[A320_Neo_FCU_VSpeed_State["Selecting"] = 2] = "Selecting";
    A320_Neo_FCU_VSpeed_State[A320_Neo_FCU_VSpeed_State["Flying"] = 3] = "Flying";
})(A320_Neo_FCU_VSpeed_State || (A320_Neo_FCU_VSpeed_State = {}));
class A320_Neo_FCU_VerticalSpeed extends A320_Neo_FCU_Component {
    constructor() {
        super(...arguments);
        this.forceUpdate = true;
        this._debug = 300;
        this.ABS_MINMAX_FPA = 9.9;
        this.ABS_MINMAX_VS = 6000;
        this.verticalSpeedForAngleRecalculationPeriod = 1500;
    }
    get currentState() {
        return this._currentState;
    }
    set currentState(v) {
        this._currentState = v;
        SimVar.SetSimVarValue("L:A320_NE0_FCU_STATE", "number", this.currentState);
    }
    init() {
        this.textVS = this.getTextElement("VS");
        this.textFPA = this.getTextElement("FPA");
        this.isActive = false;
        this.isFPAMode = false;
        this._enterIdleState();
        this.refresh(false, false, 0, 0, true);
    }
    onFlightStart() {
        super.onFlightStart();
        const selectedValue = Simplane.getAutoPilotSelectedVerticalSpeedHoldValue();
        if (selectedValue == 0) {
            this._enterIdleState(0);
        } else {
            this.onPull();
        }
    }
    onPush() {
        this.currentState = A320_Neo_FCU_VSpeed_State.Zeroing;
        SimVar.SetSimVarValue("K:AP_PANEL_ALTITUDE_HOLD", "Number", 1);
        SimVar.SetSimVarValue("K:AP_PANEL_VS_ON", "Number", 1);
        SimVar.SetSimVarValue("L:A32NX_AUTOPILOT_FPA_SELECTED", "Degree", 0);
        clearTimeout(this._resetSelectionTimeout);
        this.forceUpdate = true;
    }
    onRotate() {
        if (this.currentState === A320_Neo_FCU_VSpeed_State.Idle || this.currentState === A320_Neo_FCU_VSpeed_State.Selecting) {
            if (this.currentState === A320_Neo_FCU_VSpeed_State.Idle) {
                const currentVSpeed = Simplane.getVerticalSpeed();
                Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, currentVSpeed);
                const currentAngle = this.calculateAngleForVerticalSpeed(currentVSpeed);
                SimVar.SetSimVarValue("L:A32NX_AUTOPILOT_FPA_SELECTED", "Degree", currentAngle);
            }
            this.currentState = A320_Neo_FCU_VSpeed_State.Selecting;
            clearTimeout(this._resetSelectionTimeout);
            this.currentState = A320_Neo_FCU_VSpeed_State.Selecting;
            this.forceUpdate = true;
            this._resetSelectionTimeout = setTimeout(() => {
                this.currentState = A320_Neo_FCU_VSpeed_State.Idle;
                this.forceUpdate = true;
            }, 10000);
        } else if (this.currentState === A320_Neo_FCU_VSpeed_State.Flying || this.currentState === A320_Neo_FCU_VSpeed_State.Zeroing) {
            this.gps.requestCall(() => {
                this.currentState = A320_Neo_FCU_VSpeed_State.Flying;
                if (!this.isFPAMode) {
                    const selectedValue = Simplane.getAutoPilotSelectedVerticalSpeedHoldValue();
                    Coherent.call("AP_VS_VAR_SET_ENGLISH", 1, selectedValue);
                }
                SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);
                SimVar.SetSimVarValue("K:AP_PANEL_VS_ON", "Number", 1);
            });
        }
    }
    onPull() {
        if (this.currentState != A320_Neo_FCU_VSpeed_State.Idle) {
            this.currentState = A320_Neo_FCU_VSpeed_State.Flying;
            if (!this.isFPAMode) {
                const selectedValue = Simplane.getAutoPilotSelectedVerticalSpeedHoldValue();
                Coherent.call("AP_VS_VAR_SET_ENGLISH", 1, selectedValue);
            }
            SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);
            SimVar.SetSimVarValue("K:AP_PANEL_VS_ON", "Number", 1);
            clearTimeout(this._resetSelectionTimeout);
            this.forceUpdate = true;
        } else {
            this.currentState = A320_Neo_FCU_VSpeed_State.Flying;
            const currentValue = Simplane.getVerticalSpeed();
            if (this.isFPAMode) {
                const angle = this.calculateAngleForVerticalSpeed(currentValue);
                SimVar.SetSimVarValue("L:A32NX_AUTOPILOT_FPA_SELECTED", "Degree", angle);
            } else {
                Coherent.call("AP_VS_VAR_SET_ENGLISH", 1, currentValue);
                Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, currentValue);
            }
            SimVar.SetSimVarValue("K:AP_PANEL_VS_ON", "Number", 1);
            SimVar.SetSimVarValue("L:A320_NEO_FCU_FORCE_SELECTED_ALT", "Number", 0);
            clearTimeout(this._resetSelectionTimeout);
            this.forceUpdate = true;
        }
    }
    _enterIdleState(idleVSpeed) {
        SimVar.SetSimVarValue("L:A320_NEO_FCU_FORCE_IDLE_VS", "Number", 0);
        if (isNaN(idleVSpeed)) {
            const targetAltitude = Simplane.getAutoPilotAltitudeLockValue("feet");
            const altitude = Simplane.getAltitude();
            const deltaAltitude = targetAltitude - altitude;
            if (isFinite(deltaAltitude)) {
                if (deltaAltitude > 100) {
                    idleVSpeed = 1500;
                } else if (deltaAltitude < -100) {
                    idleVSpeed = -1500;
                }
            }
        }
        Coherent.call("AP_VS_VAR_SET_ENGLISH", 1, idleVSpeed);
        this.currentState = A320_Neo_FCU_VSpeed_State.Idle;
        this.forceUpdate = true;
        const currentAirspeedHold = Simplane.getAutoPilotAirspeedHoldValue();
        this.gps.requestCall(() => {
            if (Simplane.getAutoPilotAirspeedManaged()) {
                Coherent.call("AP_SPD_VAR_SET", 2, currentAirspeedHold);
            } else {
                Coherent.call("AP_SPD_VAR_SET", 1, currentAirspeedHold);
            }
            SimVar.SetSimVarValue("K:FLIGHT_LEVEL_CHANGE_ON", "Number", 1);
        });
    }
    update(_deltaTime) {
        if (SimVar.GetSimVarValue("L:A320_NEO_FCU_FORCE_IDLE_VS", "number") === 1) {
            this._enterIdleState();
        }
        const isFPAMode = SimVar.GetSimVarValue("L:A32NX_TRK_FPA_MODE_ACTIVE", "Bool");
        if (this.currentState === A320_Neo_FCU_VSpeed_State.Flying) {
            const altitude = Simplane.getAltitude();
            const targetAltitude = Simplane.getAutoPilotAltitudeLockValue("feet");
            const deltaAltitude = targetAltitude - altitude;
            if (isFPAMode && this.currentState === A320_Neo_FCU_VSpeed_State.Flying) {
                this.timeSinceVerticalSpeedForAngleRecalculation = (this.timeSinceVerticalSpeedForAngleRecalculation + _deltaTime) || 0;
                if (this.timeSinceVerticalSpeedForAngleRecalculation > this.verticalSpeedForAngleRecalculationPeriod) {
                    const angle = SimVar.GetSimVarValue("L:A32NX_AUTOPILOT_FPA_SELECTED", "Degree");
                    const verticalSpeed = this.calculateVerticalSpeedForAngle(angle);
                    Coherent.call("AP_VS_VAR_SET_ENGLISH", 1, verticalSpeed);
                    Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, verticalSpeed);
                    this.timeSinceVerticalSpeedForAngleRecalculation = 0;
                }
            }
            const targetVerticalSpeed = Simplane.getAutoPilotVerticalSpeedHoldValue();
            if (deltaAltitude * targetVerticalSpeed < 1) {
                this.currentState = A320_Neo_FCU_VSpeed_State.Idle;
                this._enterIdleState();
                this.forceUpdate = true;
            }
            if (Math.abs(deltaAltitude) < 200) {
                this.currentState = A320_Neo_FCU_VSpeed_State.Idle;
                this._enterIdleState();
                this.forceUpdate = true;
            }
        } else if (this.currentState === A320_Neo_FCU_VSpeed_State.Zeroing) {
            Coherent.call("AP_VS_VAR_SET_ENGLISH", 1, 5);
            SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);
        }
        if (this._debug-- < 0 || this.forceUpdate) {
            this._debug = 300;
        }
        const lightsTest = SimVar.GetSimVarValue("L:XMLVAR_LTS_Test", "Bool");
        if (isFPAMode) {
            const angle = SimVar.GetSimVarValue("L:A32NX_AUTOPILOT_FPA_SELECTED", "Degree");
            this.refresh(true, true, angle, lightsTest, this.forceUpdate);
        } else {
            this.refresh(true, false, Simplane.getAutoPilotSelectedVerticalSpeedHoldValue(), lightsTest, this.forceUpdate);
        }
        this.forceUpdate = false;
    }
    refresh(_isActive, _isFPAMode, _value, _lightsTest, _force = false) {
        if ((_isActive != this.isActive) || (_isFPAMode != this.isFPAMode) || (_value != this.currentValue) || (_lightsTest !== this.lightsTest) || _force) {
            if (this.isFPAMode != _isFPAMode) {
                this.onFPAModeChanged(_isFPAMode);
            }
            this.isActive = _isActive;
            this.isFPAMode = _isFPAMode;
            this.currentValue = _value;
            this.lightsTest = _lightsTest;
            if (this.lightsTest) {
                this.setTextElementActive(this.textVS, true);
                this.setTextElementActive(this.textFPA, true);
                this.textValueContent = "+8.888";
                return;
            }
            this.setTextElementActive(this.textVS, !this.isFPAMode);
            this.setTextElementActive(this.textFPA, this.isFPAMode);
            if (this.isActive && this.currentState != A320_Neo_FCU_VSpeed_State.Idle) {
                const sign = (this.currentValue < 0) ? "~" : "+";
                if (this.isFPAMode) {
                    let value = Math.abs(this.currentValue);
                    value = Math.round(value * 10).toString().padStart(2, "0");
                    value = `${value.substring(0, 1)}.${value.substring(1)}`;
                    this.textValueContent = sign + value;
                } else {
                    if (this.currentState === A320_Neo_FCU_VSpeed_State.Zeroing) {
                        this.textValueContent = ("{sp}00oo");
                    } else {
                        var value = Math.floor(this.currentValue);
                        value = Math.abs(value);
                        this.textValueContent = sign + (Math.floor(value * 0.01).toString().padStart(2, "0")) + "oo";
                    }
                }
            } else {
                this.textValueContent = "~----";
            }
        }
    }
    onEvent(_event) {
        if (_event === "VS_INC") {
            this.onRotate();
        } else if (_event === "VS_DEC") {
            this.onRotate();
        } else if (_event === "VS_ZERO") {
            this.onPush();
        } else if (_event === "VS_HOLD") {
            this.onPull();
        } else if (_event === "AP_DEC_FPA") {
            // TODO: increments of more than 0.1 if rolling quickly.
            const currentFpa = SimVar.GetSimVarValue("L:A32NX_AUTOPILOT_FPA_SELECTED", "Degree");
            const newFpa = Utils.Clamp(Math.round((currentFpa - 0.1) * 10) / 10, -this.ABS_MINMAX_FPA, this.ABS_MINMAX_FPA);
            SimVar.SetSimVarValue("L:A32NX_AUTOPILOT_FPA_SELECTED", "Degree", newFpa);
            const verticalSpeed = this.calculateVerticalSpeedForAngle(newFpa);
            Coherent.call("AP_VS_VAR_SET_ENGLISH", 1, verticalSpeed);
            Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, verticalSpeed);
            this.onRotate();
        } else if (_event === "AP_INC_FPA") {
            const currentFpa = SimVar.GetSimVarValue("L:A32NX_AUTOPILOT_FPA_SELECTED", "Degree");
            const newFpa = Utils.Clamp(Math.round((currentFpa + 0.1) * 10) / 10, -this.ABS_MINMAX_FPA, this.ABS_MINMAX_FPA);
            SimVar.SetSimVarValue("L:A32NX_AUTOPILOT_FPA_SELECTED", "Degree", newFpa);
            const verticalSpeed = this.calculateVerticalSpeedForAngle(newFpa);
            Coherent.call("AP_VS_VAR_SET_ENGLISH", 1, verticalSpeed);
            Coherent.call("AP_VS_VAR_SET_ENGLISH", 2, verticalSpeed);
            this.onRotate();
        }
    }
    onFPAModeChanged(_newValue) {
        if (_newValue) {
            const verticalSpeed = Simplane.getAutoPilotVerticalSpeedHoldValue();
            const angle = this.calculateAngleForVerticalSpeed(verticalSpeed);
            SimVar.SetSimVarValue("L:A32NX_AUTOPILOT_FPA_SELECTED", "Degree", angle);
        }
    }
    /**
     * Calculates the vertical speed needed to fly a flight path angle at the current ground speed.
     * @param {number} _angle The flight path angle in degrees.
     * @returns {number} The corresponding vertical speed in feet per minute.
     */
    calculateVerticalSpeedForAngle(_angle) {
        if (_angle == 0) {
            return 0;
        }
        const _groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "Meters per second");
        const groundSpeed = _groundSpeed * 3.28084 * 60; // Now in feet per minute.
        const angle = _angle * Math.PI / 180; // Now in radians.
        const verticalSpeed = Math.tan(angle) * groundSpeed;
        return Utils.Clamp(verticalSpeed, -this.ABS_MINMAX_VS, this.ABS_MINMAX_VS);
    }
    /**
     * Calculates the flight path angle for a given vertical speed, assuming it is flown at the current ground speed.
     * @param {number} verticalSpeed The flight path angle in feet per minute.
     * @returns {number} The corresponding flight path angle in degrees.
     */
    calculateAngleForVerticalSpeed(verticalSpeed) {
        if (Math.abs(verticalSpeed) < 10) {
            return 0;
        }
        const _groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "Meters per second");
        const groundSpeed = _groundSpeed * 3.28084 * 60; // Now in feet per minute.
        const angle = Math.atan(verticalSpeed / groundSpeed);
        const _angle = angle * 180 / Math.PI;
        return Utils.Clamp(_angle, -this.ABS_MINMAX_FPA, this.ABS_MINMAX_FPA);
    }
}

class A320_Neo_FCU_LargeScreen extends NavSystemElement {
    init(root) {
        if (this.components == null) {
            this.components = new Array();
            this.components.push(new A320_Neo_FCU_Speed(this.gps, "Speed"));
            this.headingDisplay = new A320_Neo_FCU_Heading(this.gps, "Heading");
            this.components.push(this.headingDisplay);
            this.components.push(new A320_Neo_FCU_Mode(this.gps, "Mode"));
            this.components.push(new A320_Neo_FCU_Altitude(this.gps, "Altitude"));
            this.verticalSpeedDisplay = new A320_Neo_FCU_VerticalSpeed(this.gps, "VerticalSpeed");
            this.components.push(this.verticalSpeedDisplay);
        }
    }
    onEnter() {
    }
    reboot() {
        if (this.components != null) {
            for (let i = 0; i < this.components.length; ++i) {
                if (this.components[i] != null) {
                    this.components[i].reboot();
                }
            }
        }
    }
    onFlightStart() {
        if (this.components != null) {
            for (let i = 0; i < this.components.length; ++i) {
                if (this.components[i] != null) {
                    this.components[i].onFlightStart();
                }
            }
        }
    }
    onUpdate(_deltaTime) {
        if (this.components != null) {
            for (let i = 0; i < this.components.length; ++i) {
                if (this.components[i] != null) {
                    this.components[i].update(_deltaTime);
                }
            }
        }
    }
    onExit() {
    }
    onEvent(_event) {
        this.headingDisplay.onEvent(_event);
        this.verticalSpeedDisplay.onEvent(_event);
    }
}

class A320_Neo_FCU_Pressure extends A320_Neo_FCU_Component {
    init() {
        this.selectedElem = this.getDivElement("Selected");
        this.standardElem = this.getDivElement("Standard");
        this.textQFE = this.getTextElement("QFE");
        this.textQNH = this.getTextElement("QNH");
        this.refresh("QFE", true, 0, 0, true);
    }
    update(_deltaTime) {
        const units = Simplane.getPressureSelectedUnits();
        const mode = Simplane.getPressureSelectedMode(Aircraft.A320_NEO);
        this.refresh(mode, (units != "millibar"), Simplane.getPressureValue(units), SimVar.GetSimVarValue("L:XMLVAR_LTS_Test", "Bool"));
    }
    refresh(_mode, _isHGUnit, _value, _lightsTest, _force = false) {
        if ((_mode != this.currentMode) || (_isHGUnit != this.isHGUnit) || (_value != this.currentValue) || (_lightsTest !== this.lightsTest) || _force) {
            var wasStd = this.currentMode == "STD" && _mode != "STD";
            this.currentMode = _mode;
            this.isHGUnit = _isHGUnit;
            this.currentValue = _value;
            this.lightsTest = _lightsTest;
            if (this.lightsTest) {
                this.standardElem.style.display = "none";
                this.selectedElem.style.display = "block";
                this.setTextElementActive(this.textQFE, true);
                this.setTextElementActive(this.textQNH, true);
                this.textValueContent = "88.88";
                return;
            }
            if (this.currentMode == "STD") {
                this.standardElem.style.display = "block";
                this.selectedElem.style.display = "none";
                SimVar.SetSimVarValue("KOHLSMAN SETTING STD", "Bool", 1);
            } else {
                this.standardElem.style.display = "none";
                this.selectedElem.style.display = "block";
                SimVar.SetSimVarValue("KOHLSMAN SETTING STD", "Bool", 0);
                const isQFE = (this.currentMode == "QFE") ? true : false;
                this.setTextElementActive(this.textQFE, isQFE);
                this.setTextElementActive(this.textQNH, !isQFE);
                let value = Math.round(Math.max(this.isHGUnit ? (this.currentValue * 100) : this.currentValue, 0));
                if (!wasStd) {
                    value = value.toString().padStart(4, "0");
                    if (this.isHGUnit) {
                        value = `${value.substring(0, 2)}.${value.substring(2)}`;
                    }
                    this.textValueContent = value;
                }
            }
        }
    }
}

class A320_Neo_FCU_SmallScreen extends NavSystemElement {
    init(root) {
        if (this.pressure == null) {
            this.pressure = new A320_Neo_FCU_Pressure(this.gps, "SmallScreen");
        }
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (this.pressure != null) {
            this.pressure.update(_deltaTime);
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
    reboot() {
        if (this.pressure) {
            this.pressure.reboot();
        }
    }
    onFlightStart() {
    }
}

registerInstrument("a320-neo-fcu-element", A320_Neo_FCU);
