class PFD_VSpeed extends NavSystemElement {
    init(root) {
        this.vsi = this.gps.getChildById("VSpeed");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        var vSpeed = fastToFixed(Simplane.getVerticalSpeed(), 1);
        this.vsi.setAttribute("vspeed", vSpeed);
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class PFD_Airspeed extends NavSystemElement {
    constructor() {
        super();
        this.lastIndicatedSpeed = -10000;
        this.lastTrueSpeed = -10000;
        this.acceleration = 0;
        this.lastSpeed = null;
        this.alwaysDisplaySpeed = false;
    }
    init(root) {
        this.airspeedElement = this.gps.getChildById("Airspeed");
        var cockpitSettings = SimVar.GetGameVarValue("", "GlassCockpitSettings");
        if (cockpitSettings && cockpitSettings.AirSpeed.Initialized) {
            this.airspeedElement.setAttribute("min-speed", cockpitSettings.AirSpeed.lowLimit.toString());
            this.airspeedElement.setAttribute("green-begin", cockpitSettings.AirSpeed.greenStart.toString());
            this.airspeedElement.setAttribute("green-end", cockpitSettings.AirSpeed.greenEnd.toString());
            this.airspeedElement.setAttribute("flaps-begin", cockpitSettings.AirSpeed.whiteStart.toString());
            this.airspeedElement.setAttribute("flaps-end", cockpitSettings.AirSpeed.whiteEnd.toString());
            this.airspeedElement.setAttribute("yellow-begin", cockpitSettings.AirSpeed.yellowStart.toString());
            this.airspeedElement.setAttribute("yellow-end", cockpitSettings.AirSpeed.yellowEnd.toString());
            this.airspeedElement.setAttribute("red-begin", cockpitSettings.AirSpeed.redStart.toString());
            this.airspeedElement.setAttribute("red-end", cockpitSettings.AirSpeed.redEnd.toString());
            this.airspeedElement.setAttribute("max-speed", cockpitSettings.AirSpeed.highLimit.toString());
            this.maxSpeed = cockpitSettings.AirSpeed.highLimit;
        }
        else {
            var designSpeeds = Simplane.getDesignSpeeds();
            this.airspeedElement.setAttribute("green-begin", designSpeeds.VS1.toString());
            this.airspeedElement.setAttribute("green-end", designSpeeds.VNo.toString());
            this.airspeedElement.setAttribute("flaps-begin", designSpeeds.VS0.toString());
            this.airspeedElement.setAttribute("flaps-end", designSpeeds.VFe.toString());
            this.airspeedElement.setAttribute("yellow-begin", designSpeeds.VNo.toString());
            this.airspeedElement.setAttribute("yellow-end", designSpeeds.VNe.toString());
            this.airspeedElement.setAttribute("red-begin", designSpeeds.VNe.toString());
            this.airspeedElement.setAttribute("red-end", designSpeeds.VMax.toString());
            this.airspeedElement.setAttribute("max-speed", designSpeeds.VNe.toString());
            this.maxSpeed = designSpeeds.VNe;
        }
        if (this.gps.instrumentXmlConfig) {
            let autoThrottleElem = this.gps.instrumentXmlConfig.getElementsByTagName("AutoThrottle");
            if (autoThrottleElem.length > 0) {
                this.alwaysDisplaySpeed = autoThrottleElem[0].textContent == "True";
            }
        }
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        var indicatedSpeed = Simplane.getIndicatedSpeed();
        if (indicatedSpeed != this.lastIndicatedSpeed) {
            this.airspeedElement.setAttribute("airspeed", indicatedSpeed.toFixed(1));
            this.lastIndicatedSpeed = indicatedSpeed;
        }
        var trueSpeed = Simplane.getTrueSpeed();
        if (trueSpeed != this.lastTrueSpeed) {
            this.airspeedElement.setAttribute("true-airspeed", trueSpeed.toString());
            this.lastTrueSpeed = trueSpeed;
        }
        if (SimVar.GetSimVarValue("AUTOPILOT FLIGHT LEVEL CHANGE", "Boolean") || this.alwaysDisplaySpeed) {
            this.airspeedElement.setAttribute("display-ref-speed", "True");
            this.airspeedElement.setAttribute("ref-speed", SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD VAR", "knots"));
        }
        else {
            this.airspeedElement.setAttribute("display-ref-speed", "False");
        }
        if (this.acceleration == NaN) {
            this.acceleration = 0;
        }
        if (this.lastSpeed == null) {
            this.lastSpeed = indicatedSpeed;
        }
        let instantAcceleration;
        if (indicatedSpeed < 20) {
            instantAcceleration = 0;
            this.acceleration = 0;
        }
        else {
            instantAcceleration = (indicatedSpeed - this.lastSpeed) / (_deltaTime / 1000);
        }
        let smoothFactor = 2000;
        this.acceleration = ((Math.max((smoothFactor - _deltaTime), 0) * this.acceleration) + (Math.min(_deltaTime, smoothFactor) * instantAcceleration)) / smoothFactor;
        this.lastSpeed = indicatedSpeed;
        this.airspeedElement.setAttribute("airspeed-trend", (this.acceleration).toString());
        let crossSpeed = SimVar.GetGameVarValue("AIRCRAFT CROSSOVER SPEED", "Knots");
        let cruiseMach = SimVar.GetGameVarValue("AIRCRAFT CRUISE MACH", "mach");
        let crossSpeedFactor = Simplane.getCrossoverSpeedFactor(this.maxSpeed, cruiseMach);
        if (crossSpeed != 0) {
            this.airspeedElement.setAttribute("max-speed", (Math.min(crossSpeedFactor, 1) * this.maxSpeed).toString());
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class PFD_Altimeter extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.lastAltitude = -10000;
        this.lastPressure = -10000;
        this.lastSelectedAltitude = -10000;
        this.selectedAltWasCaptured = false;
        this.blinkTime = 0;
        this.alertState = 0;
        this.altimeterIndex = 0;
        this.readyToSet = false;
    }
    init(root) {
        this.altimeterElement = this.gps.getChildById("Altimeter");
        if (this.gps.instrumentXmlConfig) {
            let altimeterIndexElems = this.gps.instrumentXmlConfig.getElementsByTagName("AltimeterIndex");
            if (altimeterIndexElems.length > 0) {
                this.altimeterIndex = parseInt(altimeterIndexElems[0].textContent) + 1;
            }
        }
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        var altitude = SimVar.GetSimVarValue("INDICATED ALTITUDE:" + this.altimeterIndex, "feet");
        var selectedAltitude = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet");
        if (altitude != this.lastAltitude) {
            this.altimeterElement.setAttribute("Altitude", altitude.toFixed(1));
            this.lastAltitude = altitude;
        }
        this.altimeterElement.setAttribute("vspeed", fastToFixed(Simplane.getVerticalSpeed(), 1));
        if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "bool")) {
            this.altimeterElement.setAttribute("reference-vspeed", fastToFixed(SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet per minute"), 0));
        }
        else {
            this.altimeterElement.setAttribute("reference-vspeed", "----");
        }
        let altitudeRefActive = true;
        if (altitudeRefActive) {
            if (selectedAltitude != this.lastSelectedAltitude) {
                this.altimeterElement.setAttribute("reference-altitude", selectedAltitude.toFixed(0));
                this.lastSelectedAltitude = selectedAltitude;
                this.selectedAltWasCaptured = false;
            }
            if (!this.selectedAltWasCaptured) {
                if (Math.abs(altitude - selectedAltitude) <= 200) {
                    this.selectedAltWasCaptured = true;
                    if (this.alertState < 2) {
                        this.blinkTime = 5000;
                    }
                    if (this.blinkTime > 0) {
                        Avionics.Utils.diffAndSetAttribute(this.altimeterElement, "selected-altitude-alert", Math.floor(this.blinkTime / 250) % 2 == 0 ? "BlueText" : "Empty");
                        this.blinkTime -= _deltaTime;
                    }
                    else {
                        Avionics.Utils.diffAndSetAttribute(this.altimeterElement, "selected-altitude-alert", "BlueText");
                    }
                }
                else if (Math.abs(altitude - selectedAltitude) <= 1000) {
                    if (this.alertState < 1) {
                        this.blinkTime = 5000;
                    }
                    if (this.blinkTime > 0) {
                        Avionics.Utils.diffAndSetAttribute(this.altimeterElement, "selected-altitude-alert", Math.floor(this.blinkTime / 250) % 2 == 0 ? "BlueBackground" : "BlueText");
                        this.blinkTime -= _deltaTime;
                    }
                    else {
                        Avionics.Utils.diffAndSetAttribute(this.altimeterElement, "selected-altitude-alert", "BlueBackground");
                    }
                }
                else {
                    this.alertState = 0;
                    Avionics.Utils.diffAndSetAttribute(this.altimeterElement, "selected-altitude-alert", "BlueText");
                }
            }
            else {
                if (Math.abs(altitude - selectedAltitude) <= 200) {
                    if (this.alertState != 2) {
                        this.blinkTime = 5000;
                        this.alertState = 2;
                    }
                    if (this.blinkTime > 0) {
                        Avionics.Utils.diffAndSetAttribute(this.altimeterElement, "selected-altitude-alert", Math.floor(this.blinkTime / 250) % 2 == 0 ? "BlueText" : "Empty");
                        this.blinkTime -= _deltaTime;
                    }
                    else {
                        Avionics.Utils.diffAndSetAttribute(this.altimeterElement, "selected-altitude-alert", "BlueText");
                    }
                }
                else {
                    if (this.alertState != 3) {
                        this.blinkTime = 5000;
                        this.gps.playInstrumentSound("tone_altitude_alert_default");
                        this.alertState = 3;
                    }
                    if (this.blinkTime > 0) {
                        Avionics.Utils.diffAndSetAttribute(this.altimeterElement, "selected-altitude-alert", Math.floor(this.blinkTime / 250) % 2 == 0 ? "YellowText" : "Empty");
                        this.blinkTime -= _deltaTime;
                    }
                    else {
                        Avionics.Utils.diffAndSetAttribute(this.altimeterElement, "selected-altitude-alert", "YellowText");
                    }
                }
            }
        }
        else {
            Avionics.Utils.diffAndSetAttribute(this.altimeterElement, "reference-altitude", "----");
            Avionics.Utils.diffAndSetAttribute(this.altimeterElement, "selected-altitude-alert", "BlueText");
        }
        let cdiSource = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool") ? 3 : SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number");
        switch (cdiSource) {
            case 1:
                if (SimVar.GetSimVarValue("NAV HAS GLIDE SLOPE:1", "Bool")) {
                    this.altimeterElement.setAttribute("vertical-deviation-mode", "GS");
                    this.altimeterElement.setAttribute("vertical-deviation-value", (SimVar.GetSimVarValue("NAV GSI:1", "number") / 127.0).toString());
                }
                else {
                    this.altimeterElement.setAttribute("vertical-deviation-mode", "None");
                }
                break;
            case 2:
                if (SimVar.GetSimVarValue("NAV HAS GLIDE SLOPE:2", "Bool")) {
                    this.altimeterElement.setAttribute("vertical-deviation-mode", "GS");
                    this.altimeterElement.setAttribute("vertical-deviation-value", (SimVar.GetSimVarValue("NAV GSI:2", "number") / 127.0).toString());
                }
                else {
                    this.altimeterElement.setAttribute("vertical-deviation-mode", "None");
                }
                break;
            case 3:
                if (this.gps.currFlightPlanManager.isActiveApproach() && Simplane.getAutoPilotApproachType() == 10) {
                    this.altimeterElement.setAttribute("vertical-deviation-mode", "GP");
                    this.altimeterElement.setAttribute("vertical-deviation-value", (SimVar.GetSimVarValue("GPS VERTICAL ERROR", "meters") / 150).toString());
                }
                else if (SimVar.GetSimVarValue("NAV HAS GLIDE SLOPE:1", "Bool")) {
                    this.altimeterElement.setAttribute("vertical-deviation-mode", "GSPreview");
                    this.altimeterElement.setAttribute("vertical-deviation-value", (SimVar.GetSimVarValue("NAV GSI:1", "number") / 127.0).toString());
                }
                else {
                    if (SimVar.GetSimVarValue("NAV HAS GLIDE SLOPE:2", "Bool")) {
                        this.altimeterElement.setAttribute("vertical-deviation-mode", "GSPreview");
                        this.altimeterElement.setAttribute("vertical-deviation-value", (SimVar.GetSimVarValue("NAV GSI:2", "number") / 127.0).toString());
                    }
                    else {
                        this.altimeterElement.setAttribute("vertical-deviation-mode", "None");
                    }
                }
                break;
        }
        var pressure = SimVar.GetSimVarValue("KOHLSMAN SETTING HG:" + this.altimeterIndex, "inches of mercury");
        pressure = pressure.toFixed(2);
        if (pressure != this.lastPressure) {
            this.altimeterElement.setAttribute("pressure", pressure);
            this.lastPressure = pressure;
        }
    }
    onExit() {
    }
    onEvent(_event) {
        switch (_event) {
            case "BARO_INC":
                SimVar.SetSimVarValue("K:KOHLSMAN_INC", "number", this.altimeterIndex);
                break;
            case "BARO_DEC":
                SimVar.SetSimVarValue("K:KOHLSMAN_DEC", "number", this.altimeterIndex);
                break;
        }
    }
}
class PFD_Attitude extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.vDir = new Vec2();
    }
    init(root) {
        this.svg = this.gps.getChildById("Horizon");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        var xyz = Simplane.getOrientationAxis();
        if (xyz) {
            this.svg.setAttribute("pitch", (xyz.pitch / Math.PI * 180).toString());
            this.svg.setAttribute("bank", (xyz.bank / Math.PI * 180).toString());
            this.svg.setAttribute("slip_skid", Simplane.getInclinometer().toString());
            this.svg.setAttribute("flight_director-active", SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR ACTIVE", "Bool") ? "true" : "false");
            this.svg.setAttribute("flight_director-pitch", SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR PITCH", "degree"));
            this.svg.setAttribute("flight_director-bank", SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR BANK", "degree"));
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class PFD_CDI extends NavSystemElement {
    init(root) {
        this.cdi = this.gps.getChildById("CDI");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.cdi.setAttribute("active", SimVar.GetSimVarValue("GPS IS ACTIVE FLIGHT PLAN", "Bool") ? "True" : "False");
        this.cdi.setAttribute("scale", "5");
        this.cdi.setAttribute("deviation", SimVar.GetSimVarValue("GPS WP CROSS TRK", "nautical mile"));
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class PFD_SimpleCompass extends NavSystemElement {
    init(root) {
        this.compass = this.gps.getChildById("Compass");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        let bearing = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree");
        var roundedbearing = fastToFixed(bearing, 3);
        this.compass.setAttribute("bearing", roundedbearing);
        this.compass.setAttribute("course", SimVar.GetSimVarValue("GPS WP DESIRED TRACK", "degree"));
        this.compass.setAttribute("course-active", SimVar.GetSimVarValue("GPS IS ACTIVE FLIGHT PLAN", "Bool") ? "True" : "False");
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class PFD_Compass extends NavSystemElement {
    constructor(_hsiElemId = null, _arcHsiElemId = null) {
        super();
        this.displayArc = true;
        this.hasLocBeenEntered = false;
        this.hasLocBeenActivated = false;
        this.ifTimer = 0;
        this.hsiElemId = _hsiElemId;
        this.arcHsiElemId = _arcHsiElemId;
    }
    init(root) {
        this.hsi = this.gps.getChildById(this.hsiElemId ? this.hsiElemId : "Compass");
        this.arcHsi = this.gps.getChildById(this.arcHsiElemId ? this.arcHsiElemId : "ArcCompass");
        this.nearestAirport = new NearestAirportList(this.gps);
        this.displayArc = SimVar.GetSimVarValue("L:Glasscockpit_HSI_Arc", "number") != 0;
    }
    onEnter() {
        if (this.hsi) {
            this.hsi.init();
        }
        if (this.arcHsi) {
            this.arcHsi.init();
        }
    }
    onUpdate(_deltaTime) {
        if (this.displayArc) {
            Avionics.Utils.diffAndSetAttribute(this.hsi, "state", "Inactive");
            Avionics.Utils.diffAndSetAttribute(this.arcHsi, "state", "Active");
            this.arcHsi.update(_deltaTime);
        }
        else {
            Avionics.Utils.diffAndSetAttribute(this.hsi, "state", "Active");
            Avionics.Utils.diffAndSetAttribute(this.arcHsi, "state", "Inactive");
            this.hsi.update(_deltaTime);
        }
        this.nearestAirport.Update(25, 200);
        if (this.nearestAirport.airports.length == 0) {
            SimVar.SetSimVarValue("L:GPS_Current_Phase", "number", 4);
        }
        else {
            SimVar.SetSimVarValue("L:GPS_Current_Phase", "number", 3);
        }
        if (this.ifTimer <= 0) {
            this.ifTimer = 2000;
            if (this.gps.currFlightPlanManager.isActiveApproach()) {
                this.gps.currFlightPlanManager.getApproachIfIcao((value) => {
                    this.ifIcao = value;
                });
            }
        }
        else {
            this.ifTimer -= this.gps.deltaTime;
        }
        if (this.gps.currFlightPlanManager.isActiveApproach() && this.gps.currFlightPlanManager.getActiveWaypointIndex() != -1 && Simplane.getAutoPilotApproachType() == 4) {
            if (((this.ifIcao && this.ifIcao != "" && this.ifIcao == this.gps.currFlightPlanManager.getActiveWaypoint().icao) || (this.gps.currFlightPlanManager.getActiveWaypointIndex() >= this.gps.currFlightPlanManager.getApproachWaypoints().length - 2)) && !this.hasLocBeenEntered) {
                let approachFrequency = this.gps.currFlightPlanManager.getApproachNavFrequency();
                if (!isNaN(approachFrequency)) {
                    SimVar.SetSimVarValue("K:NAV1_RADIO_SWAP", "number", 0);
                    SimVar.SetSimVarValue("K:NAV1_RADIO_SET_HZ", "hertz", approachFrequency * 1000000);
                }
                this.hasLocBeenEntered = true;
            }
            else if (((this.ifIcao && this.ifIcao != "" && this.ifIcao == this.gps.currFlightPlanManager.getApproachWaypoints()[this.gps.currFlightPlanManager.getActiveWaypointIndex() - 1].icao && this.hasLocBeenEntered) || (this.gps.currFlightPlanManager.getActiveWaypointIndex() == this.gps.currFlightPlanManager.getApproachWaypoints().length - 1)) && !this.hasLocBeenActivated) {
                if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "boolean")) {
                    SimVar.SetSimVarValue("K:TOGGLE_GPS_DRIVES_NAV1", "number", 0);
                }
                SimVar.SetSimVarValue("K:AP_NAV_SELECT_SET", "number", 1);
                this.hasLocBeenActivated = true;
            }
        }
        else {
            this.hasLocBeenEntered = false;
            this.hasLocBeenActivated = false;
        }
    }
    onExit() {
    }
    get cdiSource() {
        if (this.hsi)
            return this.hsi.logic_cdiSource;
        return 0;
    }
    set cdiSource(_val) {
        if (this.hsi)
            this.hsi.logic_cdiSource = _val;
    }
    get dmeSource() {
        return SimVar.GetSimVarValue("L:Glasscockpit_DmeSource", "Number");
    }
    set dmeSource(_val) {
        SimVar.SetSimVarValue("L:Glasscockpit_DmeSource", "Number", _val);
    }
    onEvent(_event) {
        this.hsi.onEvent(_event);
        switch (_event) {
            case "SoftKeys_HSI_360":
                this.displayArc = false;
                SimVar.SetSimVarValue("L:Glasscockpit_HSI_Arc", "number", 0);
                break;
            case "SoftKeys_HSI_ARC":
                this.displayArc = true;
                SimVar.SetSimVarValue("L:Glasscockpit_HSI_Arc", "number", 1);
                break;
        }
    }
}
class PFD_Attitude_old extends NavSystemIFrameElement {
    init(root) {
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        var xyz = Simplane.getOrientationAxis();
        var roll = SimVar.GetSimVarValue("ATTITUDE INDICATOR BANK DEGREES", "degree") / 360;
        this.canvas["setRollScale"](roll);
        this.canvas["setPitchScaleRotation"](roll);
        var pitch = -SimVar.GetSimVarValue("ATTITUDE INDICATOR PITCH DEGREES", "degree") / 88.88;
        this.canvas["setPitchScaleValue"](pitch);
        var slipSkid = Simplane.getInclinometer();
        this.canvas["setSlipSkid"](slipSkid);
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class PFD_NavStatus extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.legToName = "";
        this.legFromName = "";
        this.currentLegDistanceValue = "";
        this.currentLegBearingValue = "";
        this.legSymbol = 0;
    }
    init(root) {
        this.isInitialized = true;
        this.currentLegFrom = this.gps.getChildById("CurrentLegFrom");
        this.currentLegSymbol = this.gps.getChildById("CurrentLegSymbol");
        this.currentLegTo = this.gps.getChildById("CurrentLegTo");
        this.currentLegDistance = this.gps.getChildById("CurrentLegDistance");
        this.currentLegBearing = this.gps.getChildById("CurrentLegBearing");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        let flightPlanActive = SimVar.GetSimVarValue("GPS IS ACTIVE FLIGHT PLAN", "boolean");
        if (flightPlanActive) {
            var legToName = SimVar.GetSimVarValue("GPS WP NEXT ID", "string");
            if (!legToName)
                legToName = "---";
            if (this.legToName != legToName) {
                if (this.currentLegTo)
                    this.currentLegTo.textContent = legToName;
                this.legToName = legToName;
            }
            if (this.gps.currFlightPlanManager.getIsDirectTo()) {
                if (this.legSymbol != 1) {
                    if (this.currentLegSymbol)
                        this.currentLegSymbol.innerHTML = '<img src="/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/direct_to.bmp" class="imgSizeM"/>';
                    if (this.currentLegFrom)
                        this.currentLegFrom.textContent = "";
                    this.legSymbol = 1;
                }
            }
            else {
                var legFromName = SimVar.GetSimVarValue("GPS WP PREV ID", "string");
                if (!legFromName)
                    legFromName = "---";
                if (this.legFromName != legFromName) {
                    if (this.currentLegFrom)
                        this.currentLegFrom.textContent = legFromName;
                    this.legFromName = legFromName;
                }
                if (this.legSymbol != 2) {
                    if (this.currentLegSymbol)
                        this.currentLegSymbol.innerHTML = '<img src="/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/course_to.bmp" class="imgSizeM"/>';
                    this.legSymbol = 2;
                }
            }
            var currentLegDistance = fastToFixed(SimVar.GetSimVarValue("GPS WP DISTANCE", "nautical miles"), 1) + "NM";
            if (this.currentLegDistanceValue != currentLegDistance) {
                if (this.currentLegDistance)
                    this.currentLegDistance.textContent = currentLegDistance;
                this.currentLegDistanceValue = currentLegDistance;
            }
            var currentLegBearing = Math.round(SimVar.GetSimVarValue("GPS WP BEARING", "degree")) + "°";
            if (this.currentLegBearingValue != currentLegBearing) {
                if (this.currentLegBearing)
                    this.currentLegBearing.textContent = currentLegBearing;
                this.currentLegBearingValue = currentLegBearing;
            }
        }
        else {
            Avionics.Utils.diffAndSet(this.currentLegTo, "");
            Avionics.Utils.diffAndSet(this.currentLegFrom, "");
            Avionics.Utils.diffAndSet(this.currentLegSymbol, "");
            Avionics.Utils.diffAndSet(this.currentLegDistance, "__._NM");
            Avionics.Utils.diffAndSet(this.currentLegBearing, "___°");
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class PFD_XPDR extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.newCode = [-1, -1, -1, -1];
        this.editTime = 0;
        this.identTime = 0;
        this.stateBeforeShutDown = 1;
        this.codeValue = "";
        this.modeValue = "";
        this.timeValue = "";
    }
    init(root) {
        this.XPDRValueElement = this.gps.getChildById("XPDRValue");
        this.XPDRModeElement = this.gps.getChildById("XPDRMode");
        this.LCLValueElement = this.gps.getChildById("LocalTime");
        if (SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number") == 0) {
            SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 1);
        }
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (this.XPDRValueElement) {
            var code = this.getCode();
            if (this.codeValue != code) {
                this.XPDRValueElement.textContent = this.getCode();
                this.codeValue = code;
            }
            var mode = "";
            let currMode = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
            if (this.identTime <= 0) {
                switch (currMode) {
                    case 1:
                        mode = "STBY";
                        break;
                    case 3:
                        mode = "ON";
                        break;
                    case 4:
                        mode = "ALT";
                        break;
                }
            }
            else {
                mode = "IDNT";
            }
            if (this.modeValue != mode) {
                this.XPDRModeElement.textContent = mode;
                this.modeValue = mode;
            }
            if (this.identTime > 0) {
                this.identTime -= _deltaTime;
                if (this.identTime <= 0) {
                    this.identTime = 0;
                }
            }
            if (this.editTime > 0) {
                this.editTime -= _deltaTime;
                if (this.editTime <= 0) {
                    this.editTime = 0;
                }
            }
            var time = this.getLocalTime();
            if (this.timeValue != time) {
                this.LCLValueElement.textContent = time;
                this.timeValue = time;
            }
        }
    }
    onExit() {
    }
    onEvent(_event) {
        switch (_event) {
            case "SoftKeys_XPNDR_IDENT":
                let currMode = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
                if (currMode == 3 || currMode == 4) {
                    this.identTime = 18000;
                }
                break;
            case "SoftKeys_XPNDR_BKSP":
                if (this.editTime > 0) {
                    if (this.currEdit > 0) {
                        this.currEdit--;
                    }
                }
                else {
                    var currCode = SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number");
                    this.newCode[0] = Math.floor(currCode / 1000);
                    this.newCode[1] = Math.floor(currCode / 100) % 10;
                    this.newCode[2] = Math.floor(currCode / 10) % 10;
                    this.currEdit = 3;
                }
                this.newCode[this.currEdit] = -1;
                this.editTime = 10000;
                break;
            case "SoftKeys_XPNDR_VFR":
                this.newCode = [1, 2, 0, 0];
                this.sendNewCode();
                this.editTime = 0;
                break;
            case "SoftKeys_XPNDR_STBY":
                SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 1);
                break;
            case "SoftKeys_XPNDR_ON":
                SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 3);
                break;
            case "SoftKeys_XPNDR_ALT":
                SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 4);
                break;
            case "SoftKeys_XPNDR_0":
                this.digitEvent(0);
                break;
            case "SoftKeys_XPNDR_1":
                this.digitEvent(1);
                break;
            case "SoftKeys_XPNDR_2":
                this.digitEvent(2);
                break;
            case "SoftKeys_XPNDR_3":
                this.digitEvent(3);
                break;
            case "SoftKeys_XPNDR_4":
                this.digitEvent(4);
                break;
            case "SoftKeys_XPNDR_5":
                this.digitEvent(5);
                break;
            case "SoftKeys_XPNDR_6":
                this.digitEvent(6);
                break;
            case "SoftKeys_XPNDR_7":
                this.digitEvent(7);
                break;
        }
    }
    getCode() {
        if (this.editTime > 0) {
            var displayCode = "";
            for (var i = 0; i < 4; i++) {
                if (this.newCode[i] == -1) {
                    displayCode += "_";
                }
                else {
                    displayCode += this.newCode[i];
                }
            }
            return displayCode;
        }
        else {
            return ("0000" + SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number")).slice(-4);
        }
    }
    digitEvent(_number) {
        if (this.editTime <= 0) {
            this.currEdit = 0;
            this.newCode = [-1, -1, -1, -1];
        }
        this.newCode[this.currEdit] = _number;
        this.currEdit++;
        this.editTime = 10000;
        if (this.currEdit == 4) {
            this.editTime = 0;
            this.sendNewCode();
        }
    }
    sendNewCode() {
        var code = this.newCode[0] * 4096 + this.newCode[1] * 256 + this.newCode[2] * 16 + this.newCode[3];
        SimVar.SetSimVarValue("K:XPNDR_SET", "Frequency BCD16", code);
    }
    getLocalTime() {
        var value = SimVar.GetGlobalVarValue("LOCAL TIME", "seconds");
        if (value) {
            var seconds = Number.parseInt(value);
            var time = Utils.SecondsToDisplayTime(seconds, true, true, false);
            return time.toString();
        }
        return "";
    }
    onShutDown() {
        this.stateBeforeShutDown = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
        if (this.stateBeforeShutDown == 0) {
            this.stateBeforeShutDown = 1;
        }
        SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 0);
    }
    onPowerOn() {
        let state = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
        if (state == 0) {
            SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", this.stateBeforeShutDown);
        }
    }
}
class PFD_OAT extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.celsiusValue = "";
    }
    init(root) {
        this.valueElement = this.gps.getChildById("OAT_Value");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        var celsius = this.getATMTemperatureC();
        if (this.celsiusValue != celsius) {
            this.valueElement.textContent = celsius;
            this.celsiusValue = celsius;
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
    getATMTemperatureC() {
        var value = SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius");
        if (value) {
            var degrees = Number.parseInt(value);
            var temperature = degrees.toString() + "° C";
            return temperature.toString();
        }
        return "";
    }
}
class PFD_Annunciations extends Annunciations {
    constructor() {
        super(...arguments);
        this.warningToneNameZ = new Name_Z("tone_warning");
        this.cautionToneNameZ = new Name_Z("tone_caution");
        this.warningTone = false;
    }
    init(root) {
        super.init(root);
        this.newAnnunciations = this.gps.getChildById("newAnnunciations");
        this.acknowledged = this.gps.getChildById("acknowledged");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (this.engineType == EngineType.ENGINE_TYPE_PISTON) {
            for (var i = 0; i < this.allMessages.length; i++) {
                var message = this.allMessages[i];
                var value = false;
                if (message.Handler)
                    value = message.Handler();
                if (value != message.Visible) {
                    this.needReload = true;
                    if (!value) {
                        message.Acknowledged = false;
                    }
                    message.Visible = value;
                }
            }
            if (this.needReload) {
                let newAnnunc = "";
                let acknowledgedAnnunc = "";
                this.alertLevel = 0;
                this.alert = false;
                this.needReload = false;
                for (var i = 0; i < this.allMessages.length; i++) {
                    var message = this.allMessages[i];
                    if (message.Visible) {
                        this.alert = true;
                        if (!message.Acknowledged) {
                            switch (message.Type) {
                                case Annunciation_MessageType.WARNING:
                                    this.alertLevel = 3;
                                    break;
                                case Annunciation_MessageType.CAUTION:
                                    if (this.alertLevel < 2) {
                                        let res = this.gps.playInstrumentSound("tone_caution");
                                        if (res) {
                                            this.isPlayingWarningTone = true;
                                            this.alertLevel = 2;
                                        }
                                    }
                                    break;
                                case Annunciation_MessageType.ADVISORY:
                                    if (this.alertLevel < 1) {
                                        this.alertLevel = 1;
                                    }
                                    break;
                            }
                        }
                        if (message.Type == Annunciation_MessageType.WARNING || message.Type == Annunciation_MessageType.CAUTION || message.Type == Annunciation_MessageType.ADVISORY) {
                            if (!message.Acknowledged) {
                                newAnnunc += "<div class=";
                                switch (message.Type) {
                                    case Annunciation_MessageType.WARNING:
                                        newAnnunc += '"Warning"';
                                        break;
                                    case Annunciation_MessageType.CAUTION:
                                        newAnnunc += '"Caution"';
                                        break;
                                    case Annunciation_MessageType.ADVISORY:
                                        newAnnunc += '"Advisory"';
                                        break;
                                }
                                newAnnunc += ">" + message.Text + "</div><br/>";
                            }
                            else {
                                acknowledgedAnnunc += "<div class=";
                                switch (message.Type) {
                                    case Annunciation_MessageType.WARNING:
                                        acknowledgedAnnunc += '"Warning"';
                                        break;
                                    case Annunciation_MessageType.CAUTION:
                                        acknowledgedAnnunc += '"Caution"';
                                        break;
                                    case Annunciation_MessageType.ADVISORY:
                                        acknowledgedAnnunc += '"Advisory"';
                                        break;
                                }
                                acknowledgedAnnunc += ">" + message.Text + "</div><br/>";
                            }
                        }
                    }
                }
                if (this.alertSoftkey) {
                    switch (this.alertLevel) {
                        case 0:
                            this.alertSoftkey.name = "ALERTS";
                            break;
                        case 1:
                            this.alertSoftkey.name = "ADVISORY";
                            break;
                        case 2:
                            this.alertSoftkey.name = "CAUTION";
                            break;
                        case 3:
                            this.alertSoftkey.name = "WARNING";
                            break;
                    }
                }
                this.newAnnunciations.innerHTML = newAnnunc;
                this.acknowledged.innerHTML = acknowledgedAnnunc;
                if (newAnnunc.length > 0 || acknowledgedAnnunc.length > 0) {
                    this.annunciations.setAttribute("state", "Visible");
                    this.alert = true;
                    if (newAnnunc.length > 0 && acknowledgedAnnunc.length > 0) {
                        this.newAnnunciations.setAttribute("state", "Bordered");
                    }
                    else {
                        this.newAnnunciations.setAttribute("state", "None");
                    }
                }
                else {
                    this.annunciations.setAttribute("state", "Hidden");
                }
            }
            if (this.alertLevel == 3 && !this.isPlayingWarningTone) {
                let res = this.gps.playInstrumentSound("tone_warning");
                if (res)
                    this.isPlayingWarningTone = true;
            }
            if (this.alertSoftkey) {
                if (this.alert) {
                    if (this.alertLevel == 0) {
                        this.alertSoftkey.state = "White";
                    }
                    else {
                        if (this.gps.blinkGetState(800, 400)) {
                            switch (this.alertLevel) {
                                case 1:
                                    this.alertSoftkey.state = "AdvisoryAlert";
                                    break;
                                case 2:
                                    this.alertSoftkey.state = "YellowAlert";
                                    break;
                                case 3:
                                    this.alertSoftkey.state = "RedAlert";
                                    break;
                            }
                        }
                        else {
                            this.alertSoftkey.state = "None";
                        }
                    }
                }
                else {
                    this.alertSoftkey.state = "None";
                }
            }
        }
    }
    onEvent(_event) {
        switch (_event) {
            case "SoftKeys_ALERT":
                if (this.alertLevel > 0) {
                    for (let i = 0; i < this.allMessages.length; i++) {
                        if (this.allMessages[i].Visible) {
                            this.allMessages[i].Acknowledged = true;
                            this.needReload = true;
                        }
                    }
                }
                else {
                    this.gps.computeEvent("Toggle_Alerts");
                }
                break;
        }
    }
    onSoundEnd(_eventId) {
        if (Name_Z.compare(_eventId, this.warningToneNameZ) || Name_Z.compare(_eventId, this.cautionToneNameZ)) {
            this.isPlayingWarningTone = false;
        }
    }
}
class PFD_ADF_DME extends NavSystemElement {
    init(root) {
        this.rootElement = root;
        this.activeAdfFreq = this.gps.getChildById("ActiveAdfFreq");
        this.stbyAdfFreq = this.gps.getChildById("StbyAdfFreq");
        this.adfMode = this.gps.getChildById("adfMode");
        this.volume = this.gps.getChildById("Volume");
        this.dmeMode = this.gps.getChildById("dmeMode");
        this.indicationText = this.gps.getChildById("indicationText");
        this.HSIElement = this.gps.getElementOfType(PFD_Compass);
        this.adfFreqSearchField = new SearchFieldAdfFrequency([this.stbyAdfFreq], this.gps);
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.stbyAdfFreq, this.adfFrequencySelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.dmeMode, this.dfeModeSelectionCallback.bind(this)),
        ];
    }
    onEnter() {
        this.rootElement.setAttribute("state", "Active");
        this.gps.ActiveSelection(this.defaultSelectables);
    }
    onUpdate(_deltaTime) {
        this.adfFreqSearchField.Update();
        this.activeAdfFreq.textContent = fastToFixed(SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:1", "KHz"), 1);
        this.volume.textContent = "100%";
        if (!this.HSIElement) {
            this.HSIElement = this.gps.getElementOfType(PFD_Compass);
        }
        if (this.HSIElement) {
            switch (this.HSIElement.dmeSource) {
                case 1:
                    this.dmeMode.textContent = "NAV1";
                    break;
                case 2:
                    this.dmeMode.textContent = "NAV2";
                    break;
            }
        }
        if (this.gps.currentInteractionState == 1 && this.gps.currentSelectableArray == this.defaultSelectables && this.gps.cursorIndex == 0) {
            Avionics.Utils.diffAndSet(this.indicationText, "ENT TO TRANSFER");
        }
        else {
            Avionics.Utils.diffAndSet(this.indicationText, "");
        }
    }
    onExit() {
        this.rootElement.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    adfFrequencySelectionCallback(_event) {
        switch (_event) {
            case "NavigationSmallInc":
            case "NavigationSmallDec":
                this.adfFreqSearchField.StartSearch(this.endAdfFreqEditCallback.bind(this));
                this.gps.currentSearchFieldWaypoint = this.adfFreqSearchField;
                this.gps.SwitchToInteractionState(3);
                break;
            case "ENT_Push":
                SimVar.SetSimVarValue("K:ADF1_RADIO_SWAP", "number", 0);
        }
    }
    endAdfFreqEditCallback() {
        this.gps.ActiveSelection(this.defaultSelectables);
    }
    adfModeSelectionCallback(_event) {
    }
    volumeSelectionCallback(_event) {
    }
    dfeModeSelectionCallback(_event) {
        switch (_event) {
            case "NavigationSmallInc":
                this.HSIElement.dmeSource = (this.HSIElement.dmeSource % 2 + 1);
                break;
            case "NavigationSmallDec":
                this.HSIElement.dmeSource--;
                if (this.HSIElement.dmeSource == 0) {
                    this.HSIElement.dmeSource = 2;
                }
                break;
        }
    }
}
class AS1000_Alerts extends NavSystemElement {
    init(root) {
        this.alertsWindow = this.gps.getChildById("AlertsWindow");
        this.alert1 = this.gps.getChildById("Alert1");
        this.alert2 = this.gps.getChildById("Alert2");
        this.alert3 = this.gps.getChildById("Alert3");
        this.slider = this.gps.getChildById("Slider");
        this.sliderCursor = this.gps.getChildById("SliderCursor");
        this.alertsGroup = new SelectableElementSliderGroup(this.gps, [
            new SelectableElement(this.gps, this.alert1, this.alertSelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.alert2, this.alertSelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.alert3, this.alertSelectionCallback.bind(this))
        ], this.slider, this.sliderCursor);
        this.defaultSelectables = [
            this.alertsGroup
        ];
    }
    onEnter() {
        this.alertsWindow.setAttribute("state", "Active");
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
        this.alertsWindow.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    alertSelectionCallback() {
    }
}
class PFD_WindData extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.mode = 0;
    }
    init(root) {
        this.svg = root;
        SimVar.SetSimVarValue("L:Glasscockpit_AOA_Mode", "number", this.mode);
    }
    getCurrentMode() {
        return this.mode;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "knots") >= 1) {
            this.svg.setAttribute("wind-mode", this.mode.toString());
            switch (this.mode) {
                case 3:
                    this.svg.setAttribute("wind-true-direction", SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "degree").toString());
                case 2:
                case 1:
                    this.svg.setAttribute("wind-direction", ((SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "degree") + 180) % 360 - SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree")).toString());
                    this.svg.setAttribute("wind-strength", SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "knots"));
                    break;
            }
        }
        else {
            this.svg.setAttribute("wind-mode", "4");
        }
    }
    onExit() {
    }
    onEvent(_event) {
        switch (_event) {
            case "SoftKeys_Wind_Off":
            case "Wind_Off":
                this.mode = 0;
                break;
            case "SoftKeys_Wind_O1":
            case "Wind_O1":
                this.mode = 1;
                break;
            case "SoftKeys_Wind_O2":
            case "Wind_O2":
                this.mode = 2;
                break;
            case "SoftKeys_Wind_O3":
            case "Wind_O3":
                this.mode = 3;
                break;
        }
        SimVar.SetSimVarValue("L:Glasscockpit_Wind_Mode", "number", this.mode);
    }
}
class MFD_WindData extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.windValue = "";
        this.strengthValue = "";
    }
    init(root) {
        this.svg = this.gps.getChildById("WindData");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        var wind = fastToFixed(SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "degree"), 0);
        if (wind != this.windValue) {
            this.svg.setAttribute("wind-direction", wind);
            this.windValue = wind;
        }
        var strength = fastToFixed(SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "knots"), 0);
        if (strength != this.strengthValue) {
            this.svg.setAttribute("wind-strength", strength);
            this.strengthValue = strength;
        }
        this.svg.setAttribute("wind-mode", "2");
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class PFD_Warnings extends Cabin_Warnings {
    init(root) {
        super.init(root);
        this.warningBox = this.gps.getChildById("Warnings");
        this.warningContent = this.gps.getChildById("WarningsContent");
    }
}
class PFD_Minimums extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.lastSource = 0;
        this.lastValue = 0;
        this.wasUpper = false;
    }
    init(root) {
        this.window = this.gps.getChildById("Minimums");
        this.altimeter = this.gps.getChildById("Altimeter");
        this.source = this.gps.getChildById("Minimums_Source");
        this.value = this.gps.getChildById("Minimums_Value");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        let mode = SimVar.GetSimVarValue("L:AS3000_MinimalsMode", "number");
        let value = SimVar.GetSimVarValue("L:AS3000_MinimalsValue", "number");
        if (value != this.lastValue || mode != this.lastSource) {
            switch (mode) {
                case 0:
                    Avionics.Utils.diffAndSetAttribute(this.altimeter, "minimum-altitude", "none");
                    Avionics.Utils.diffAndSetAttribute(this.window, "state", "Inactive");
                    break;
                case 1:
                    Avionics.Utils.diffAndSet(this.source, "BARO MIN");
                    Avionics.Utils.diffAndSet(this.value, value + '<span class="unit">FT</span>');
                    Avionics.Utils.diffAndSetAttribute(this.altimeter, "minimum-altitude", value);
                    Avionics.Utils.diffAndSetAttribute(this.window, "state", "Active");
                    break;
                case 2:
                    Avionics.Utils.diffAndSet(this.source, "COMP MIN");
                    Avionics.Utils.diffAndSet(this.value, value + '<span class="unit">FT</span>');
                    Avionics.Utils.diffAndSetAttribute(this.altimeter, "minimum-altitude", value);
                    Avionics.Utils.diffAndSetAttribute(this.window, "state", "Active");
                    break;
                case 3:
                    Avionics.Utils.diffAndSet(this.source, "RA MIN");
                    Avionics.Utils.diffAndSet(this.value, value + '<span class="unit">FT</span>');
                    Avionics.Utils.diffAndSetAttribute(this.window, "state", "Active");
                    break;
            }
            this.wasUpper = false;
            this.lastSource = mode;
            this.lastValue = value;
        }
        let state = "";
        switch (mode) {
            case 1:
                let currHeight = SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet");
                if (!this.wasUpper || currHeight > (value + 100)) {
                    state = "";
                    if (!this.wasUpper && currHeight > (value + 100)) {
                        this.wasUpper = true;
                    }
                }
                else if (currHeight > value) {
                    state = "near";
                }
                else {
                    state = "low";
                }
                break;
            case 2:
                break;
            case 3:
                let currentBaroAlt = SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet");
                let currentRAAlt = SimVar.GetSimVarValue("RADIO HEIGHT", "feet");
                Avionics.Utils.diffAndSetAttribute(this.altimeter, "minimum-altitude", (value + currentBaroAlt - currentRAAlt).toString());
                if (!this.wasUpper || currentRAAlt > (value + 100)) {
                    state = "";
                    if (!this.wasUpper && currentRAAlt > (value + 100)) {
                        this.wasUpper = true;
                    }
                }
                else if (currentRAAlt > value) {
                    state = "near";
                }
                else {
                    state = "low";
                }
                break;
                break;
        }
        Avionics.Utils.diffAndSetAttribute(this.value, "state", state);
        Avionics.Utils.diffAndSetAttribute(this.altimeter, "minimum-altitude-state", state);
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class PFD_RadarAltitude extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.isActive = false;
    }
    init(root) {
        this.window = this.gps.getChildById("RadarAltitude");
        this.altimeter = this.gps.getChildById("Altimeter");
        this.value = this.gps.getChildById("RA_Value");
        if (this.gps.instrumentXmlConfig) {
            let raElem = this.gps.instrumentXmlConfig.getElementsByTagName("RadarAltitude");
            if (raElem.length > 0) {
                this.isActive = raElem[0].textContent == "True";
            }
        }
        if (!this.isActive) {
            this.window.setAttribute("display", "none");
        }
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (!this.isActive) {
            return;
        }
        var xyz = Simplane.getOrientationAxis();
        let radarAltitude = SimVar.GetSimVarValue("RADIO HEIGHT", "feet");
        if (radarAltitude > 0 && radarAltitude < 2500 && (Math.abs(xyz.bank) < Math.PI * 0.35)) {
            Avionics.Utils.diffAndSetAttribute(this.altimeter, "radar-altitude", radarAltitude);
            Avionics.Utils.diffAndSet(this.value, fastToFixed(radarAltitude, 0));
            Avionics.Utils.diffAndSetAttribute(this.window, "state", "Active");
        }
        else {
            Avionics.Utils.diffAndSetAttribute(this.altimeter, "radar-altitude", "1000");
            Avionics.Utils.diffAndSetAttribute(this.window, "state", "Inactive");
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class PFD_MarkerBeacon extends NavSystemElement {
    init(root) {
        this.element = this.gps.getChildById("MarkerBeacon");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        let state = SimVar.GetSimVarValue("MARKER BEACON STATE", "number");
        switch (state) {
            case 0:
                Avionics.Utils.diffAndSetAttribute(this.element, "state", "Inactive");
                break;
            case 1:
                Avionics.Utils.diffAndSetAttribute(this.element, "state", "O");
                Avionics.Utils.diffAndSet(this.element, "O");
                break;
            case 2:
                Avionics.Utils.diffAndSetAttribute(this.element, "state", "M");
                Avionics.Utils.diffAndSet(this.element, "M");
                break;
            case 3:
                Avionics.Utils.diffAndSetAttribute(this.element, "state", "I");
                Avionics.Utils.diffAndSet(this.element, "I");
                break;
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class PFD_InnerMap extends MapInstrumentElement {
    constructor() {
        super(...arguments);
        this.gpsWasInReversionaryMode = false;
    }
    init(_root) {
        super.init(_root);
        this.mapContainer = this.gps.getChildById("InnerMap");
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if (this.gps.isInReversionaryMode() != this.gpsWasInReversionaryMode) {
            this.gpsWasInReversionaryMode = this.gps.isInReversionaryMode();
            this.gps.requestCall(() => {
                this.mapContainer.style.display = "Block";
                if (this.instrument)
                    this.instrument.resize();
            });
        }
    }
    onEvent(_event) {
        super.onEvent(_event);
        if (_event == "SoftKeys_InsetOn") {
            this.mapContainer.style.display = "Block";
        }
        if (_event == "SoftKeys_InsetOff") {
            this.mapContainer.style.display = "None";
        }
    }
}
class PFD_AutopilotDisplay extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.altimeterIndex = 0;
    }
    init(root) {
        this.AP_LateralActive = this.gps.getChildById("AP_LateralActive");
        this.AP_LateralArmed = this.gps.getChildById("AP_LateralArmed");
        this.AP_Status = this.gps.getChildById("AP_Status");
        this.AP_YDStatus = this.gps.getChildById("AP_YDStatus");
        this.AP_FDIndicatorArrow = this.gps.getChildById("AP_FDIndicatorArrow");
        this.AP_VerticalActive = this.gps.getChildById("AP_VerticalActive");
        this.AP_ModeReference = this.gps.getChildById("AP_ModeReference");
        this.AP_Armed = this.gps.getChildById("AP_Armed");
        this.AP_ArmedReference = this.gps.getChildById("AP_ArmedReference");
        if (this.gps.instrumentXmlConfig) {
            let altimeterIndexElems = this.gps.instrumentXmlConfig.getElementsByTagName("AltimeterIndex");
            if (altimeterIndexElems.length > 0) {
                this.altimeterIndex = parseInt(altimeterIndexElems[0].textContent) + 1;
            }
        }
        SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "feet", 10000);
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        Avionics.Utils.diffAndSet(this.AP_YDStatus, SimVar.GetSimVarValue("AUTOPILOT YAW DAMPER", "Bool") ? "YD" : "");
        Avionics.Utils.diffAndSet(this.AP_Status, SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool") ? "AP" : "");
        Avionics.Utils.diffAndSetAttribute(this.AP_FDIndicatorArrow, "state", SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR ACTIVE", "Bool") ? "Active" : "Inactive");
        if (SimVar.GetSimVarValue("AUTOPILOT PITCH HOLD", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, "PIT");
            Avionics.Utils.diffAndSet(this.AP_ModeReference, "");
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT FLIGHT LEVEL CHANGE", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, "FLC");
            if (SimVar.GetSimVarValue("L:XMLVAR_AirSpeedIsInMach", "Boolean")) {
                Avionics.Utils.diffAndSet(this.AP_ModeReference, "M" + fastToFixed(SimVar.GetSimVarValue("AUTOPILOT MACH HOLD VAR", "mach"), 3));
            }
            else {
                Avionics.Utils.diffAndSet(this.AP_ModeReference, fastToFixed(SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD VAR", "knots"), 0) + "KT");
            }
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT MACH HOLD", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, "FLC");
            Avionics.Utils.diffAndSet(this.AP_ModeReference, "M" + fastToFixed(SimVar.GetSimVarValue("AUTOPILOT MACH HOLD VAR", "mach"), 3));
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Boolean")) {
            if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE ARM", "Boolean")) {
                Avionics.Utils.diffAndSet(this.AP_VerticalActive, "ALTS");
            }
            else {
                Avionics.Utils.diffAndSet(this.AP_VerticalActive, "ALT");
            }
            Avionics.Utils.diffAndSet(this.AP_ModeReference, fastToFixed(SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:2", "feet"), 0) + "FT");
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, "VS");
            Avionics.Utils.diffAndSet(this.AP_ModeReference, fastToFixed(SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet per minute"), 0) + "FPM");
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ACTIVE", "Boolean")) {
            if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
                Avionics.Utils.diffAndSet(this.AP_VerticalActive, "GP");
            }
            else {
                Avionics.Utils.diffAndSet(this.AP_VerticalActive, "GS");
            }
            Avionics.Utils.diffAndSet(this.AP_ModeReference, "");
        }
        else {
            Avionics.Utils.diffAndSet(this.AP_VerticalActive, "");
            Avionics.Utils.diffAndSet(this.AP_ModeReference, "");
        }
        if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE ARM", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_Armed, "ALT");
            Avionics.Utils.diffAndSet(this.AP_ArmedReference, "");
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ARM", "Boolean")) {
            if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
                Avionics.Utils.diffAndSet(this.AP_Armed, "V ALT");
                Avionics.Utils.diffAndSet(this.AP_ArmedReference, "GP");
            }
            else {
                Avionics.Utils.diffAndSet(this.AP_Armed, "GS");
                Avionics.Utils.diffAndSet(this.AP_ArmedReference, "");
            }
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_Armed, "ALTS");
            Avionics.Utils.diffAndSet(this.AP_ArmedReference, "");
        }
        else {
            Avionics.Utils.diffAndSet(this.AP_Armed, "");
            Avionics.Utils.diffAndSet(this.AP_ArmedReference, "");
        }
        if (SimVar.GetSimVarValue("AUTOPILOT WING LEVELER", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_LateralActive, "LVL");
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT BANK HOLD", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_LateralActive, "ROL");
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_LateralActive, "HDG");
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Boolean")) {
            if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
                Avionics.Utils.diffAndSet(this.AP_LateralActive, "FMS");
            }
            else {
                if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number"), "Boolean")) {
                    Avionics.Utils.diffAndSet(this.AP_LateralActive, "LOC");
                }
                else {
                    Avionics.Utils.diffAndSet(this.AP_LateralActive, "VOR");
                }
            }
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT BACKCOURSE HOLD", "Boolean")) {
            Avionics.Utils.diffAndSet(this.AP_LateralArmed, "BC");
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Boolean")) {
            if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
                Avionics.Utils.diffAndSet(this.AP_LateralArmed, "FMS");
            }
            else {
                if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number"), "Boolean")) {
                    Avionics.Utils.diffAndSet(this.AP_LateralActive, "LOC");
                }
                else {
                    Avionics.Utils.diffAndSet(this.AP_LateralActive, "VOR");
                }
            }
        }
        else {
            Avionics.Utils.diffAndSet(this.AP_LateralActive, "");
        }
        if (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Bool") || SimVar.GetSimVarValue("AUTOPILOT WING LEVELER", "Bool")) {
            if (SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Boolean")) {
                if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
                    Avionics.Utils.diffAndSet(this.AP_LateralArmed, "FMS");
                }
                else {
                    if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number"), "Boolean")) {
                        Avionics.Utils.diffAndSet(this.AP_LateralArmed, "LOC");
                    }
                    else {
                        Avionics.Utils.diffAndSet(this.AP_LateralArmed, "VOR");
                    }
                }
            }
            else if (SimVar.GetSimVarValue("AUTOPILOT BACKCOURSE HOLD", "Boolean")) {
                Avionics.Utils.diffAndSet(this.AP_LateralArmed, "BC");
            }
            else if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Boolean")) {
                if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
                    Avionics.Utils.diffAndSet(this.AP_LateralArmed, "FMS");
                }
                else {
                    if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number"), "Boolean")) {
                        Avionics.Utils.diffAndSet(this.AP_LateralArmed, "LOC");
                    }
                    else {
                        Avionics.Utils.diffAndSet(this.AP_LateralArmed, "VOR");
                    }
                }
            }
            else {
                Avionics.Utils.diffAndSet(this.AP_LateralArmed, "");
            }
        }
        else {
            Avionics.Utils.diffAndSet(this.AP_LateralArmed, "");
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class MFD_FlightPlanLine {
    constructor(_element) {
        this.element = _element;
    }
    getnbElements() {
        return 1;
    }
    getSoftKeyMenu() {
        return null;
    }
    getIndex() {
        return -1;
    }
    getType() {
        return MFD_WaypointType.empty;
    }
}
class MFD_DepartureLine extends MFD_FlightPlanLine {
    constructor(_name, _element) {
        super(_element);
        this.name = "";
        this.name = _name;
    }
    getString() {
        return '<td class="Select0 SelectableWhite" colspan="' + this.element.nbColumn + '">Departure - ' + this.name + '</td>';
    }
    onEvent(_subIndex, _event) {
        return false;
    }
}
class MFD_ArrivalLine extends MFD_FlightPlanLine {
    constructor(_name, _element) {
        super(_element);
        this.name = "";
        this.name = _name;
    }
    getString() {
        return '<td class="Select0 SelectableWhite" colspan="' + this.element.nbColumn + '">Arrival - ' + this.name + '</td>';
    }
    onEvent(_subIndex, _event) {
        return false;
    }
}
class MFD_ApproachLine extends MFD_FlightPlanLine {
    constructor(_name, _element) {
        super(_element);
        this.name = "";
        this.name = _name;
    }
    getString() {
        return '<td class="Select0 SelectableWhite" colspan="' + this.element.nbColumn + '">Approach - ' + this.name + '</td>';
    }
    onEvent(_subIndex, _event) {
        switch (_event) {
            case "CLR":
            case "CLR_Push":
                this.element.gps.currFlightPlanManager.setApproachIndex(-1);
                break;
        }
        return false;
    }
}
class MFD_EnrouteLine extends MFD_FlightPlanLine {
    getString() {
        return '<td class="Select0 SelectableWhite" colspan="' + this.element.nbColumn + '">Enroute</td>';
    }
    onEvent(_subIndex, _event) {
        return false;
    }
}
class MFD_AirwayLine extends MFD_FlightPlanLine {
    getString() {
        return '<td class="Select0 SelectableWhite" colspan="' + this.element.nbColumn + '">Airway</td>';
    }
    onEvent(_subIndex, _event) {
        return false;
    }
}
var MFD_WaypointType;
(function (MFD_WaypointType) {
    MFD_WaypointType[MFD_WaypointType["empty"] = 0] = "empty";
    MFD_WaypointType[MFD_WaypointType["departure"] = 1] = "departure";
    MFD_WaypointType[MFD_WaypointType["enroute"] = 2] = "enroute";
    MFD_WaypointType[MFD_WaypointType["arrival"] = 3] = "arrival";
    MFD_WaypointType[MFD_WaypointType["approach"] = 4] = "approach";
})(MFD_WaypointType || (MFD_WaypointType = {}));
class MFD_WaypointLine extends MFD_FlightPlanLine {
    constructor(waypoint, index, _waypointType, _element) {
        super(_element);
        this.waypointType = MFD_WaypointType.enroute;
        this.softKeys = new SoftKeysMenu();
        this.waypoint = waypoint;
        this.index = index;
        this.waypointType = _waypointType;
    }
    getString() {
        if (this.waypoint) {
            let infos = this.waypoint.GetInfos();
            let altitudeConstraint = "_____";
            if (this.waypoint.altitudeinFP !== 0) {
                altitudeConstraint = Math.round(this.waypoint.altitudeinFP).toString();
            }
            return '<td class="Select0 SelectableElement">' + (infos.ident != "" ? infos.ident : this.waypoint.ident) + '</td><td>' + (isNaN(this.waypoint.bearingInFP) ? "" : fastToFixed(this.waypoint.bearingInFP, 0) + '°') + '</td><td>' + fastToFixed(this.waypoint.distanceInFP, 0) + 'Nm</td><td class="Select1 SelectableElement altitudeConstraint" altitudeMode="' + this.waypoint.altitudeModeinFP + '"> ' + altitudeConstraint + 'FT </td>';
        }
        else if (this.element.emptyLine != "") {
            return this.element.emptyLine;
        }
        else {
            return '<td class="Select0 SelectableElement"></td><td> </td><td> </td><td> </td>';
        }
    }
    getNbElements() {
        return 2;
    }
    onEvent(_subIndex, _event) {
        if (this.element.gps.popUpElement == null) {
            switch (_event) {
                case "NavigationSmallInc":
                case "NavigationSmallDec":
                    switch (_subIndex) {
                        case 0:
                            this.element.gps.switchToPopUpPage(this.element.waypointWindow, this.element.onWaypointSelectionEnd.bind(this.element));
                            this.element.selectedIndex = this.index;
                            break;
                        case 1:
                            this.element.selectedIndex = this.index;
                            this.element.editAltitude(this.waypointType, this.index);
                            break;
                    }
                    return true;
                case "CLR":
                case "CLR_Push":
                    this.element.removeWaypoint(this.index);
                    break;
            }
        }
        return false;
    }
    getSoftKeyMenu() {
        if (this.waypointType == MFD_WaypointType.approach) {
            return null;
        }
        else {
            return this.softKeys;
        }
    }
    getIndex() {
        return this.index;
    }
    getType() {
        return this.waypointType;
    }
}
class MFD_ApproachWaypointLine extends MFD_FlightPlanLine {
    constructor(waypoint, index, _element) {
        super(_element);
        this.softKeys = new SoftKeysMenu();
        this.waypoint = waypoint;
        this.index = index;
        this.softKeys = null;
    }
    getString() {
        if (this.waypoint) {
            return '<td class="Select0 SelectableElement">' + this.waypoint.ident + '</td><td>' + fastToFixed(this.waypoint.bearingInFP, 0) + '°' + '</td><td>' + fastToFixed(this.waypoint.distanceInFP, 0) + 'Nm</td><td class="Select1 SelectableElement"> _____FT </td>';
        }
        else {
            return '<td class="Select0 SelectableElement"></td><td> </td><td> </td><td> </td>';
        }
    }
    onEvent(_subIndex, _event) {
        if (this.element.gps.popUpElement == null) {
            switch (_event) {
                case "NavigationSmallInc":
                case "NavigationSmallDec":
                    this.element.gps.switchToPopUpPage(this.element.waypointWindow, this.element.onWaypointSelectionEnd.bind(this.element));
                    this.element.selectedIndex = this.index;
                    return true;
                case "CLR":
                case "CLR_Push":
                    this.element.removeWaypoint(this.index);
                    break;
            }
        }
        return false;
    }
    getSoftKeyMenu() {
        return this.softKeys;
    }
    getIndex() {
        return this.index;
    }
    getType() {
        return MFD_WaypointType.approach;
    }
}
class MFD_ActiveFlightPlan_Element extends NavSystemElement {
    constructor(_waypointLineClass = MFD_WaypointLine, _approachWaypointLineClass = MFD_ApproachWaypointLine, _nbLine = 11, _nbColumn = 4) {
        super();
        this.lines = [];
        this.lineElements = [];
        this.lastFplSize = 0;
        this._t = 0;
        this.upToDateWaypoints = false;
        this.emptyLine = "";
        this.isPopup = false;
        this.waypointLineClass = _waypointLineClass;
        this.approachWaypointLineClass = _approachWaypointLineClass;
        this.nbLine = _nbLine;
        this.nbColumn = _nbColumn;
    }
    init(root) {
        this.titleElement = this.gps.getChildById("AFPL_Name");
        this.CurrentLegArrow = this.gps.getChildById("CurrentLegArrow");
        let selectableElements = [];
        for (let i = 1; i <= this.nbLine; i++) {
            this.lineElements.push(root.getElementsByClassName("L" + i)[0]);
            selectableElements.push(new SelectableElementGroup(this.gps, this.lineElements[i - 1], [this.fplLineEvent.bind(this), this.fplLineAltitudeEvent.bind(this)]));
        }
        this.fplSelectable = new SelectableElementSliderGroup(this.gps, selectableElements, root.getElementsByClassName("Slider")[0], root.getElementsByClassName("SliderCursor")[0], 1, this.emptyLine);
        this.defaultSelectables = [
            this.fplSelectable
        ];
        this.waypointWindow = new NavSystemElementContainer("Waypoint Information", "WaypointsWindows", new MFD_Waypoints());
        this.waypointWindow.gps = this.gps;
        this.container.defaultMenu = new ContextualMenu("PAGE MENU", [
            new ContextualMenuElement("Store Flight Plan", null, true),
            new ContextualMenuElement("Invert Flight Plan", null, true),
            new ContextualMenuElement("Delete Flight Plan", this.removeFlightPlan.bind(this)),
            new ContextualMenuElement("Remove Departure", null, true),
            new ContextualMenuElement("Remove Arrival", null, true),
            new ContextualMenuElement("Remove Approach", null, true),
            new ContextualMenuElement("Closest Point Of FPL", null, true),
            new ContextualMenuElement("Change Fields", null, true),
            new ContextualMenuElement("Activate Leg", this.activateLegFromMenu.bind(this), this.isCurrentlySelectedNotALeg.bind(this)),
        ]);
        this.mapContainer = root.getElementsByClassName("Map")[0];
        this.mapElement = this.gps.getElementOfType(MapInstrumentElement);
        this.altitudeSearchField = new SearchFieldAltitude([], this.gps);
    }
    onEnter() {
        this.gps.currFlightPlanManager.updateFlightPlan(() => {
            this.gps.currFlightPlanManager.updateCurrentApproach(this.updateWaypoints.bind(this));
            this.updateAltitudeRoles();
            if (this.mapContainer && this.mapElement) {
                this.mapContainer.appendChild(this.mapElement.instrument);
                this.mapElement.setDisplayMode(EMapDisplayMode.GPS);
                this.mapElement.instrument.setCenteredOnPlane();
            }
        });
    }
    onUpdate(_deltaTime) {
        this._t++;
        if (this._t > 30) {
            this.gps.currFlightPlanManager.updateFlightPlan(() => {
                this.gps.currFlightPlanManager.updateCurrentApproach(this.updateWaypoints.bind(this));
                this.updateAltitudeRoles();
            });
            this._t = 0;
        }
        Avionics.Utils.diffAndSet(this.titleElement, (this.gps.currFlightPlanManager.getWaypointsCount() > 0 ? (this.gps.currFlightPlanManager.getWaypoint(0).infos.ident != "" ? this.gps.currFlightPlanManager.getWaypoint(0).infos.ident : this.gps.currFlightPlanManager.getWaypoint(0).ident) : "______") + "/" + (this.gps.currFlightPlanManager.getWaypointsCount() > 1 ? (this.gps.currFlightPlanManager.getWaypoint(this.gps.currFlightPlanManager.getWaypointsCount() - 1).infos.ident != "" ? this.gps.currFlightPlanManager.getWaypoint(this.gps.currFlightPlanManager.getWaypointsCount() - 1).infos.ident : this.gps.currFlightPlanManager.getWaypoint(this.gps.currFlightPlanManager.getWaypointsCount() - 1).ident) : "______"));
        if (!this.upToDateWaypoints) {
            this.updateWaypoints();
        }
        if (this.lastFplSize != this.gps.currFlightPlanManager.getWaypointsCount()) {
            this.gps.currFlightPlanManager.updateCurrentApproach(this.updateWaypoints.bind(this));
        }
        else {
            let strings = this.fplSelectable.getStringElements();
            let different = false;
            for (let i = 0; i < this.lines.length; i++) {
                let line = this.lines[i].getString();
                if (line != strings[i]) {
                    different = true;
                    strings[i] = line;
                }
            }
            if (different) {
                this.fplSelectable.updateDisplay();
            }
        }
        let realIndex;
        let lastIndex;
        if (this.gps.currFlightPlanManager.isActiveApproach()) {
            let index = this.gps.currFlightPlanManager.getApproachActiveWaypointIndex();
            realIndex = this.getDisplayIndexFromFplIndex(index, true);
            if (index == 0) {
                lastIndex = this.getDisplayIndexFromFplIndex(this.gps.currFlightPlanManager.getWaypointsCount() - 2);
            }
            else {
                lastIndex = this.getDisplayIndexFromFplIndex(this.gps.currFlightPlanManager.getApproachActiveWaypointIndex() - 1, true);
            }
        }
        else {
            realIndex = this.getDisplayIndexFromFplIndex(this.gps.currFlightPlanManager.getActiveWaypointIndex());
            lastIndex = this.getDisplayIndexFromFplIndex(this.gps.currFlightPlanManager.getActiveWaypointIndex() - 1);
        }
        if (realIndex > 0 && realIndex >= this.fplSelectable.getOffset() && realIndex <= this.fplSelectable.getOffset() + this.nbLine) {
            let x;
            let y1;
            let y2;
            let lineWidth;
            let lineDistance;
            let headWidth;
            if (realIndex == this.fplSelectable.getOffset() || lastIndex < this.fplSelectable.getOffset()) {
                let endElement = this.lineElements[realIndex - this.fplSelectable.getOffset()];
                x = endElement.offsetLeft + endElement.parentElement.clientWidth / 20;
                y1 = endElement.offsetTop - endElement.clientHeight / 1.5 - endElement.clientHeight;
                y2 = endElement.offsetTop - endElement.clientHeight / 1.5;
                lineWidth = endElement.parentElement.clientWidth / 100;
                lineDistance = endElement.parentElement.clientWidth / 30;
                headWidth = endElement.parentElement.clientWidth / 40;
            }
            else if (realIndex == this.fplSelectable.getOffset() + this.nbLine || lastIndex == this.fplSelectable.getOffset() + this.nbLine - 1) {
                let beginElement = this.lineElements[lastIndex - this.fplSelectable.getOffset()];
                x = beginElement.offsetLeft + beginElement.parentElement.clientWidth / 20;
                y1 = beginElement.offsetTop - beginElement.clientHeight / 1.5;
                y2 = beginElement.offsetTop - beginElement.clientHeight / 1.5 + beginElement.clientHeight;
                lineWidth = beginElement.parentElement.clientWidth / 100;
                lineDistance = beginElement.parentElement.clientWidth / 30;
                headWidth = beginElement.parentElement.clientWidth / 40;
            }
            else {
                let beginElement = this.lineElements[lastIndex - this.fplSelectable.getOffset()];
                let endElement = this.lineElements[realIndex - this.fplSelectable.getOffset()];
                x = beginElement.offsetLeft + beginElement.parentElement.clientWidth / 20;
                y1 = beginElement.offsetTop - beginElement.clientHeight / 1.5;
                y2 = endElement.offsetTop - endElement.clientHeight / 1.5;
                lineWidth = beginElement.parentElement.clientWidth / 100;
                lineDistance = beginElement.parentElement.clientWidth / 30;
                headWidth = beginElement.parentElement.clientWidth / 40;
            }
            Avionics.Utils.diffAndSetAttribute(this.CurrentLegArrow, "d", "M" + x + " " + (y1 - lineWidth / 2) + " L" + x + " " + (y1 + lineWidth / 2) + " L" + (x - lineDistance) + " " + (y1 + lineWidth / 2) + " L" + (x - lineDistance) + " " + (y2 - lineWidth / 2) + " L" + (x - headWidth) + " " + (y2 - lineWidth / 2) + " L" + (x - headWidth) + " " + (y2 - lineWidth * 1.5) + " L" + x + " " + y2 + " L" + (x - headWidth) + " " + (y2 + lineWidth * 1.5) + " L" + (x - headWidth) + " " + (y2 + lineWidth / 2) + " L" + (x - lineDistance - lineWidth) + " " + (y2 + lineWidth / 2) + " L" + (x - lineDistance - lineWidth) + " " + (y1 - lineWidth / 2) + "Z");
        }
        else {
            Avionics.Utils.diffAndSetAttribute(this.CurrentLegArrow, "d", "");
        }
        this.altitudeSearchField.Update();
    }
    getDisplayIndexFromFplIndex(_index, _approach = false) {
        for (let i = 0; i < this.lines.length; i++) {
            if (this.lines[i].getIndex() == _index) {
                let isApproachPoint = this.lines[i].getType() == MFD_WaypointType.approach;
                if (_approach == isApproachPoint) {
                    return i;
                }
            }
        }
    }
    getFplIndexFromDisplayIndex(_index) {
        return this.lines[_index].getIndex();
    }
    updateWaypoints() {
        this.upToDateWaypoints = false;
        this.lines = [];
        let departure = this.gps.currFlightPlanManager.getDepartureWaypointsMap();
        let arrival = this.gps.currFlightPlanManager.getArrivalWaypointsMap();
        let approach = this.gps.currFlightPlanManager.getApproachWaypoints();
        let enroute = this.gps.currFlightPlanManager.getEnRouteWaypoints();
        let origin = this.gps.currFlightPlanManager.getOrigin();
        let destination = this.gps.currFlightPlanManager.getDestination();
        let offsetCount = 0;
        if (departure.length > 0) {
            this.lines.push(new MFD_DepartureLine(this.gps.currFlightPlanManager.getDeparture() ? this.gps.currFlightPlanManager.getDeparture().name : "", this));
            this.lines.push(new this.waypointLineClass(this.gps.currFlightPlanManager.getOrigin(), 0, MFD_WaypointType.departure, this));
            offsetCount++;
            for (let i = 0; i < departure.length; i++) {
                this.lines.push(new this.waypointLineClass(departure[i], i + offsetCount, MFD_WaypointType.departure, this));
            }
            offsetCount += this.gps.currFlightPlanManager.getDepartureWaypointsCount();
        }
        if (departure.length > 0 || arrival.length > 0 || (approach && approach.length > 0)) {
            this.lines.push(new MFD_EnrouteLine(this));
        }
        if (departure.length == 0 && origin) {
            this.lines.push(new this.waypointLineClass(origin, offsetCount, MFD_WaypointType.enroute, this));
            offsetCount++;
        }
        for (let i = 0; i < enroute.length; i++) {
            this.lines.push(new this.waypointLineClass(enroute[i], i + offsetCount, MFD_WaypointType.enroute, this));
        }
        offsetCount += enroute.length;
        if (arrival.length > 0) {
            let arrivalObj = this.gps.currFlightPlanManager.getArrival();
            this.lines.push(new MFD_ArrivalLine(arrivalObj ? this.gps.currFlightPlanManager.getArrival().name : "", this));
            for (let i = 0; i < arrival.length; i++) {
                this.lines.push(new this.waypointLineClass(arrival[i], i + offsetCount, MFD_WaypointType.arrival, this));
            }
            offsetCount += this.gps.currFlightPlanManager.getArrivalWaypointsCount();
        }
        if (destination) {
            this.lines.push(new this.waypointLineClass(destination, offsetCount, MFD_WaypointType.enroute, this));
            offsetCount++;
        }
        if (approach && approach.length > 0) {
            let airportApproach = this.gps.currFlightPlanManager.getAirportApproach();
            if (airportApproach) {
                this.lines.push(new MFD_ApproachLine(airportApproach.name, this));
            }
            for (let i = 0; i < approach.length; i++) {
                this.lines.push(new this.approachWaypointLineClass(approach[i], i, this));
            }
        }
        this.lines.push(new this.waypointLineClass(null, offsetCount, MFD_WaypointType.empty, this));
        this.lastFplSize = this.gps.currFlightPlanManager.getWaypointsCount();
        let strings = [];
        for (let i = 0; i < this.lines.length; i++) {
            strings.push(this.lines[i].getString());
        }
        this.fplSelectable.setStringElements(strings);
        this.upToDateWaypoints = true;
        this.updateAltitudeRoles();
    }
    onExit() {
    }
    onEvent(_event) {
    }
    fplLineEvent(_event, _index) {
        if (!this.gps.popUpElement || this.isPopup) {
            return this.lines[_index].onEvent(0, _event);
        }
    }
    fplLineAltitudeEvent(_event, _index) {
        if (!this.gps.popUpElement || this.isPopup) {
            return this.lines[_index].onEvent(1, _event);
        }
    }
    editAltitude(_type, _index) {
        this.fplSelectable.lockDisplay();
        this.altitudeSearchField.elements = [this.fplSelectable.GetElement()];
        this.gps.currentSearchFieldWaypoint = this.altitudeSearchField;
        this.altitudeSearchField.StartSearch(this.onEndAltitudeEdition.bind(this, _type, _index));
        this.gps.SwitchToInteractionState(3);
    }
    onEndAltitudeEdition(_type, _index, _altitude) {
        this.gps.currFlightPlanManager.setWaypointAdditionalData(_index, "ALTITUDE_MODE", "Manual");
        this.gps.currFlightPlanManager.setWaypointAltitude(_altitude / 3.2808, _index, this.updateWaypoints.bind(this));
        this.fplSelectable.unlockDisplay();
    }
    updateAltitudeRoles() {
        let maxAltitude = undefined;
        for (let i = this.gps.currFlightPlanManager.getWaypointsCount() - 1; i >= 0; i--) {
            let wp = this.gps.currFlightPlanManager.getWaypoint(i);
            if (maxAltitude == undefined || wp.altitudeinFP > maxAltitude) {
                if (wp.altitudeModeinFP == "Subdued") {
                    this.gps.currFlightPlanManager.setWaypointAdditionalData(i, "ALTITUDE_MODE", "Manual");
                }
                maxAltitude = wp.altitudeinFP;
            }
            if (wp.altitudeinFP < maxAltitude) {
                if (wp.altitudeModeinFP == "Manual") {
                    this.gps.currFlightPlanManager.setWaypointAdditionalData(i, "ALTITUDE_MODE", "Subdued");
                }
            }
        }
    }
    onWaypointSelectionEnd() {
        if (this.gps.lastRelevantICAO) {
            this.gps.currFlightPlanManager.addWaypoint(this.gps.lastRelevantICAO, this.selectedIndex, () => {
                if (!this.gps.popUpElement) {
                    this.updateWaypoints();
                    this.gps.ActiveSelection(this.defaultSelectables);
                    this.fplSelectable.incrementIndex();
                }
            });
        }
    }
    invertFlightPlan() {
    }
    removeFlightPlan() {
        this.gps.currFlightPlanManager.clearFlightPlan();
        this.gps.SwitchToInteractionState(0);
    }
    removeWaypoint(_index) {
        this.gps.currFlightPlanManager.removeWaypoint(_index, true, () => {
            this.updateWaypoints.bind(this);
        });
    }
    getSoftKeysMenu() {
        if (this.lines.length > this.fplSelectable.getIndex() && this.gps.currentInteractionState == 1) {
            return this.lines[this.fplSelectable.getIndex()].getSoftKeyMenu();
        }
        else {
            return null;
        }
    }
    activateLegFromMenu() {
        this.activateLeg(this.lines[this.fplSelectable.getIndex()].getIndex());
        this.gps.SwitchToInteractionState(1);
    }
    activateLeg(_index, _approach = false) {
        console.log("CommonPFD_MFD.ts > Activate leg for index " + _index);
        if (_approach) {
            let icao = this.gps.currFlightPlanManager.getApproachWaypoints()[_index].icao;
            this.gps.currFlightPlanManager.activateApproach(() => {
                let index = this.gps.currFlightPlanManager.getApproachWaypoints().findIndex(w => { return w.infos && w.infos.icao === icao; });
                this.gps.currFlightPlanManager.setActiveWaypointIndex(index);
            });
        }
        else {
            this.gps.currFlightPlanManager.setActiveWaypointIndex(_index);
        }
    }
    isCurrentlySelectedNotALeg() {
        return this.lines[this.fplSelectable.getIndex()].getType() == MFD_WaypointType.empty;
    }
}
class MFD_Waypoints extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.selectedElement = 0;
        this.state = 0;
    }
    init(_root) {
        this.window = _root;
        this.WaypointWindow = this.gps.getChildById("WaypointsWindows");
        this.identElement = this.gps.getChildById("WPTIdent");
        this.symbolElement = this.gps.getChildById("WPTSymbol");
        this.regionElement = this.gps.getChildById("WPTRegion");
        this.facilityElement = this.gps.getChildById("WPTFacility");
        this.cityElement = this.gps.getChildById("WPTCity");
        this.mapElement = this.gps.getChildById("WPTMap");
        this.bearingElement = this.gps.getChildById("WPTBearing");
        this.distanceElement = this.gps.getChildById("WPTDistance");
        this.longitudeElement = this.gps.getChildById("WPTLongitude");
        this.latitudeElement = this.gps.getChildById("WPTLatitude");
        this.selectableElements = [];
        this.geoCalc = new GeoCalcInfo(this.gps);
        this.icaoSearchField = new SearchFieldWaypointICAO(this.gps, [this.identElement], this.gps, "AWNV");
        let dup = new MFD_DuplicateWaypoint();
        dup.icaoSearchField = this.icaoSearchField;
        this.duplicateWaypointsWindow = new NavSystemElementContainer("Duplicate Waypoints", "DuplicateWaypointWindow", dup);
        this.duplicateWaypointsWindow.setGPS(this.gps);
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
        this.ActivateSearchField();
        this.icao = null;
        this.type = null;
    }
    onUpdate(_deltaTime) {
        for (let i = 0; i < this.selectableElements.length; i++) {
            if (i == this.selectedElement && this.state == 0) {
                this.selectableElements[i].updateSelection(this.gps.blinkGetState(400, 200));
            }
            else {
                this.selectableElements[i].updateSelection(false);
            }
        }
        this.icaoSearchField.Update();
        var infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && (infos.icao != "" || infos.ident != "")) {
            this.facilityElement.textContent = infos.name;
            this.cityElement.textContent = infos.city;
            this.regionElement.textContent = infos.region;
            var logo = infos.imageFileName();
            if (logo != "") {
                Avionics.Utils.diffAndSetAttribute(this.symbolElement, "src", "/Pages/VCockpit/Instruments/Shared/Map/Images/" + logo);
            }
            else {
                Avionics.Utils.diffAndSetAttribute(this.symbolElement, "src", '' + logo);
            }
            if (infos.coordinates && infos.coordinates.lat && infos.coordinates.long) {
                this.geoCalc.SetParams(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"), infos.coordinates.lat, infos.coordinates.long, true);
                this.geoCalc.Compute(function () {
                    this.bearingElement.textContent = fastToFixed(this.geoCalc.bearing, 0);
                    this.distanceElement.textContent = fastToFixed(this.geoCalc.distance, 0);
                }.bind(this));
                this.longitudeElement.textContent = this.gps.longitudeFormat(infos.coordinates.long);
                this.latitudeElement.textContent = this.gps.latitudeFormat(infos.coordinates.lat);
            }
            else {
                this.longitudeElement.textContent = "";
                this.latitudeElement.textContent = "";
                this.bearingElement.textContent = "___";
                this.distanceElement.textContent = "____";
            }
        }
        else {
            this.identElement.textContent = "_____";
            this.regionElement.textContent = "__________";
            this.facilityElement.textContent = "______________________";
            this.cityElement.textContent = "______________________";
        }
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
        this.gps.lastRelevantICAO = this.icao;
        this.gps.lastRelevantICAOType = this.type;
    }
    onEvent(_event) {
        switch (_event) {
            case "CLR":
                this.gps.requestCall(() => {
                    this.gps.closePopUpElement();
                });
                break;
        }
    }
    ActivateSearchField() {
        this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
        this.icaoSearchField.StartSearch(this.onEndSearch.bind(this));
        this.gps.SwitchToInteractionState(3);
    }
    onEndSearch() {
        if (this.icaoSearchField.duplicates.length > 1) {
            this.gps.switchToPopUpPage(this.duplicateWaypointsWindow, this.gps.popUpCloseCallback);
        }
        else {
            this.icao = this.icaoSearchField.getWaypoint().icao;
            this.type = this.icaoSearchField.getWaypoint().type;
            this.gps.closePopUpElement();
        }
    }
}
class MFD_DuplicateWaypoint extends NavSystemElement {
    init(root) {
        this.window = root;
        this.ident = root.getElementsByClassName("Ident")[0];
        let lines = [];
        for (let i = 1; i <= 5; i++) {
            lines.push(new SelectableElement(this.gps, root.getElementsByClassName("L" + i)[0], this.selectionEventCallback.bind(this)));
        }
        let slider = root.getElementsByClassName("Slider")[0];
        let sliderCursor = slider.getElementsByClassName("SliderCursor")[0];
        this.elementSelectionGroup = new SelectableElementSliderGroup(this.gps, lines, slider, sliderCursor);
        this.defaultSelectables = [this.elementSelectionGroup];
        this.ident = root.getElementsByClassName("Ident")[0];
        this.nameElement = root.getElementsByClassName("Name")[0];
        this.lat = root.getElementsByClassName("Latitude")[0];
        this.long = root.getElementsByClassName("Longitude")[0];
        this.bearing = root.getElementsByClassName("Bearing")[0];
        this.distance = root.getElementsByClassName("Distance")[0];
        this.geoCalc = new GeoCalcInfo(this.gps);
    }
    onEnter() {
        this.icao = null;
        this.type = null;
        this.window.setAttribute("State", "Active");
        this.gps.ActiveSelection(this.defaultSelectables);
    }
    onUpdate(_deltaTime) {
        Avionics.Utils.diffAndSet(this.ident, this.icaoSearchField.duplicates[0].ident);
        let strings = [];
        for (let i = 0; i < this.icaoSearchField.duplicates.length; i++) {
            let infos = this.icaoSearchField.duplicates[i].GetInfos();
            let logo = infos.imageFileName();
            let type = "";
            let typeLetter = infos.getWaypointType();
            switch (typeLetter) {
                case "A":
                    type = "AIRPT";
                    break;
                case "N":
                    type = "NDB";
                    break;
                case "V":
                    type = "VOR";
                    break;
                default:
                    type = "INT";
                    break;
            }
            strings.push("<div>" + type + '</div><img src="' + (logo == "" ? "" : "/Pages/VCockpit/Instruments/Shared/Map/Images/" + logo) + '"></img><div>' + infos.region + '</div>');
        }
        this.elementSelectionGroup.setStringElements(strings);
        let info = this.icaoSearchField.duplicates[this.elementSelectionGroup.getIndex()].GetInfos();
        if (info && info.icao != "") {
            Avionics.Utils.diffAndSet(this.nameElement, info.name);
            if (info.coordinates) {
                Avionics.Utils.diffAndSet(this.lat, this.gps.latitudeFormat(info.coordinates.lat));
                Avionics.Utils.diffAndSet(this.long, this.gps.longitudeFormat(info.coordinates.long));
                if (info.coordinates.lat && info.coordinates.long) {
                    this.geoCalc.SetParams(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"), info.coordinates.lat, info.coordinates.long, true);
                    this.geoCalc.Compute(function () {
                        Avionics.Utils.diffAndSet(this.bearing, fastToFixed(this.geoCalc.bearing, 0) + "°");
                        Avionics.Utils.diffAndSet(this.distance, fastToFixed(this.geoCalc.distance, 0) + "NM");
                    }.bind(this));
                }
            }
        }
    }
    onExit() {
        this.gps.lastRelevantICAO = this.icao;
        this.gps.lastRelevantICAOType = this.type;
        this.window.setAttribute("State", "Inactive");
    }
    onEvent(_event) {
    }
    selectionEventCallback(_event, _index) {
        if (_event == "ENT_Push") {
            this.icao = this.icaoSearchField.duplicates[_index].icao;
            this.type = this.icaoSearchField.duplicates[_index].type;
            this.gps.closePopUpElement();
        }
    }
}
class DRCT_SelectionWindow extends NavSystemElement {
    constructor(_drctElement) {
        super();
        this.isVisible = false;
        this.drctElement = _drctElement;
    }
    init(root) {
        this.window = root;
        this.title = this.gps.getChildById("Title");
        this.slider = this.gps.getChildById("Slider");
        this.sliderCursor = this.gps.getChildById("SliderCursor");
        this.elementsSliderGroup = new SelectableElementSliderGroup(this.gps, [
            new SelectableElement(this.gps, this.gps.getChildById("DRCTSelectElem1"), this.elementSelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.gps.getChildById("DRCTSelectElem2"), this.elementSelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.gps.getChildById("DRCTSelectElem3"), this.elementSelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.gps.getChildById("DRCTSelectElem4"), this.elementSelectionCallback.bind(this))
        ], this.slider, this.sliderCursor);
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.title, this.titleSelectionCalback.bind(this)),
            this.elementsSliderGroup
        ];
    }
    onEnter() {
        this.menuIndex = 0;
        this.isVisible = true;
        this.gps.currFlightPlan.FillWithCurrentFP();
    }
    onUpdate(_deltaTime) {
        if (this.isVisible) {
            this.window.setAttribute("state", "Active");
            var elements = [];
            switch (this.menuIndex) {
                case 0:
                    this.title.textContent = "FPL";
                    for (let i = 0; i < this.gps.currFlightPlan.wayPoints.length; i++) {
                        elements.push(this.gps.currFlightPlan.wayPoints[i].ident);
                    }
                    break;
                case 1:
                    this.title.textContent = "NRST";
                    break;
                case 2:
                    this.title.textContent = "RECENT";
                    break;
                case 3:
                    this.title.textContent = "USER";
                    break;
                case 4:
                    this.title.textContent = "AIRWAY";
                    break;
            }
            this.elementsSliderGroup.setStringElements(elements);
        }
        else {
            this.window.setAttribute("state", "Inactive");
        }
    }
    onExit() {
        this.isVisible = false;
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
        if (_event == "CLR") {
            this.close();
        }
    }
    titleSelectionCalback(_event) {
        switch (_event) {
            case "NavigationSmallDec":
                this.menuIndex = (this.menuIndex - 1 + 5) % 5;
                break;
            case "NavigationSmallInc":
                this.menuIndex = (this.menuIndex + 1) % 5;
                break;
        }
    }
    elementSelectionCallback(_event, _index) {
        if (_event == "ENT_Push") {
            switch (this.menuIndex) {
                case 0:
                    this.drctElement.icaoSearchField.SetWaypoint(this.gps.currFlightPlan.wayPoints[_index].type, this.gps.currFlightPlan.wayPoints[_index].GetInfos().icao);
                    break;
                case 1:
                    break;
                case 2:
                    break;
                case 3:
                    break;
                case 4:
                    break;
            }
            this.close();
        }
    }
    close() {
        this.onExit();
        this.drctElement.selectionWindowDisplayed = false;
        this.gps.ActiveSelection(this.drctElement.getDefaultSelectables());
        this.gps.cursorIndex = 0;
    }
}
class GlassCockpit_DirectTo extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.isActive = false;
        this.selectionWindowDisplayed = false;
    }
    init(root) {
        this.directToWindow = this.gps.getChildById("DirectToWindow");
        this.identElement = this.gps.getChildById("DRCTIdent");
        this.symbolElement = this.gps.getChildById("DRCTSymbol");
        this.regionElement = this.gps.getChildById("DRCTRegion");
        this.facilityElement = this.gps.getChildById("DRCTFacility");
        this.cityElement = this.gps.getChildById("DRCTCity");
        this.vnavHeightElement = this.gps.getChildById("DRCTVnavHeight");
        this.mapElement = this.gps.getChildById("DRCTMap");
        this.bearingElement = this.gps.getChildById("DRCTBearing");
        this.distanceElement = this.gps.getChildById("DRCTDistance");
        this.activateButtonElement = this.gps.getChildById("DRCTActivateButton");
        this.holdButtonElement = this.gps.getChildById("DRCTHoldButton");
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.identElement, this.activateSearchField.bind(this)),
            new SelectableElement(this.gps, this.activateButtonElement, this.activateDirectTo.bind(this))
        ];
        this.container.defaultMenu = new ContextualMenu("PAGE MENU", [
            new ContextualMenuElement("Cancel Direct-To NAV", this.cancelDirectTo.bind(this)),
            new ContextualMenuElement("Clear Vertical Constraints", null, true),
            new ContextualMenuElement("Edit Hold", null, true),
            new ContextualMenuElement("Hold At Present Position", null, true)
        ]);
        this.geoCalc = new GeoCalcInfo(this.gps);
        this.icaoSearchField = new SearchFieldWaypointICAO(this.gps, [this.identElement], this.gps, "AWNV");
        this.nameSearchField = new SearchFieldWaypointName(this.gps, [this.facilityElement], this.gps, "AWNV", this.icaoSearchField);
        this.isInitialized = true;
        this.selectionWindow = new DRCT_SelectionWindow(this);
        this.selectionWindowContainer = new NavSystemElementContainer("DRCTSelectMenu", "DRCTSelectionWindow", this.selectionWindow);
        this.selectionWindowContainer.setGPS(this.gps);
    }
    onEnter() {
        this.isActive = true;
        this.selectionWindowDisplayed = false;
        this.gps.ActiveSelection(this.defaultSelectables);
        if (this.gps.lastRelevantICAO) {
            this.icaoSearchField.SetWaypoint(this.gps.lastRelevantICAOType, this.gps.lastRelevantICAO);
            this.gps.cursorIndex = 1;
        }
    }
    onUpdate(_deltaTime) {
        if (this.isActive) {
            if (this.selectionWindowDisplayed) {
                this.selectionWindowContainer.onUpdate(_deltaTime);
            }
            this.directToWindow.setAttribute("state", "Active");
            this.nameSearchField.Update();
            this.icaoSearchField.Update();
            var infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao != "") {
                if (this.cityElement)
                    this.cityElement.textContent = infos.city;
                if (this.regionElement)
                    this.regionElement.textContent = infos.region;
                var logo = infos.GetSymbol();
                if (logo != "") {
                    if (this.symbolElement)
                        this.symbolElement.innerHTML = '<img src="/Pages/VCockpit/Instruments/NavSystems/Shared/Images/' + logo + '"/>';
                }
                else {
                    if (this.symbolElement)
                        this.symbolElement.innerHTML = "";
                }
                if (infos.coordinates && infos.coordinates.lat && infos.coordinates.long) {
                    this.bearingElement.textContent = fastToFixed(Avionics.Utils.computeGreatCircleHeading(new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude")), infos.coordinates) - SimVar.GetSimVarValue("MAGVAR", "degrees"), 0) + "°";
                    this.distanceElement.innerHTML = fastToFixed(Avionics.Utils.computeGreatCircleDistance(new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude")), infos.coordinates), 1) + '<span class="unit">NM</span>';
                }
            }
            else {
                if (this.identElement)
                    this.identElement.textContent = "_____";
                if (this.regionElement)
                    this.regionElement.textContent = "__________";
                if (this.facilityElement)
                    this.facilityElement.textContent = "______________________";
                if (this.cityElement)
                    this.cityElement.textContent = "___________";
                if (this.bearingElement)
                    this.bearingElement.textContent = "";
                if (this.symbolElement)
                    this.symbolElement.innerHTML = "";
                if (this.distanceElement)
                    this.distanceElement.innerHTML = "";
            }
        }
        else {
            this.directToWindow.setAttribute("state", "Inactive");
        }
    }
    onExit() {
        this.isActive = false;
        this.gps.SwitchToInteractionState(0);
        this.directToWindow.setAttribute("state", "Inactive");
        if (this.selectionWindowDisplayed) {
            this.selectionWindow.close();
        }
    }
    onEvent(_event) {
        if (this.selectionWindowDisplayed) {
            this.selectionWindowContainer.onEvent(_event);
        }
    }
    searchFieldEndCallback() {
        this.gps.ActiveSelection(this.defaultSelectables);
        this.gps.cursorIndex = 1;
    }
    activateSearchField(_event) {
        if (_event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.icaoSearchField.StartSearch(this.searchFieldEndCallback.bind(this));
            this.gps.SwitchToInteractionState(3);
        }
        if (_event == "CLR_Push" || _event == "CLR") {
            this.cancelDirectTo();
        }
    }
    activateSearchFieldName(_event) {
        if (_event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            this.gps.currentSearchFieldWaypoint = this.nameSearchField;
            this.nameSearchField.StartSearch(this.searchFieldEndCallback.bind(this));
            this.gps.SwitchToInteractionState(3);
        }
        if (_event == "CLR_Push" || _event == "CLR") {
            this.cancelDirectTo();
        }
    }
    activateDirectTo(_event) {
        if (_event == "ENT_Push") {
            this.gps.closePopUpElement();
            this.gps.currFlightPlanManager.activateDirectTo(this.icaoSearchField.getUpdatedInfos().icao);
        }
    }
    cancelDirectTo() {
        this.gps.currFlightPlanManager.cancelDirectTo();
        this.gps.SwitchToInteractionState(1);
    }
}
class MFD_NearestAirport_Element extends NavSystemElement {
    constructor(_nbLines = 5, _nbFreqs = 3) {
        super();
        this.runwayIndex = 0;
        this.nbLines = _nbLines;
        this.nbFreqs = _nbFreqs;
    }
    init(root) {
        this.facility = root.getElementsByClassName("Facility")[0];
        this.city = root.getElementsByClassName("City")[0];
        this.elevation = root.getElementsByClassName("Elevation")[0];
        this.runwayDesignation = root.getElementsByClassName("Rwy_Designation")[0];
        this.runwaySurface = root.getElementsByClassName("Rwy_Surface")[0];
        this.runwayLength = root.getElementsByClassName("Rwy_Length")[0];
        this.runwayWidth = root.getElementsByClassName("Rwy_Width")[0];
        this.nearestAirportList = new NearestAirportList(this.gps);
        {
            this.airportTable = this.gps.getChildById("Nrst_AirportList");
            let elems = [];
            for (let i = 1; i <= this.nbLines; i++) {
                elems.push(new SelectableElement(this.gps, this.airportTable.getElementsByClassName("L" + i)[0], this.airportCallback.bind(this)));
            }
            let airportPart = this.gps.getChildById("NrstAirportList");
            this.airportList = new SelectableElementSliderGroup(this.gps, elems, airportPart.getElementsByClassName("Slider")[0], airportPart.getElementsByClassName("SliderCursor")[0]);
        }
        {
            this.frequenciesTable = this.gps.getChildById("Nrst_AirportFreqList");
            let elems = [];
            for (let i = 1; i <= this.nbFreqs; i++) {
                elems.push(new SelectableElement(this.gps, this.frequenciesTable.getElementsByClassName("L" + i)[0], this.frequenciesCallback.bind(this)));
            }
            let freqPart = this.gps.getChildById("NrstAirportFreqs");
            this.frequenciesList = new SelectableElementSliderGroup(this.gps, elems, freqPart.getElementsByClassName("Slider")[0], freqPart.getElementsByClassName("SliderCursor")[0]);
        }
        {
            this.approachesTable = this.gps.getChildById("Nrst_AirportApproachesList");
            let elems = [];
            for (let i = 1; i <= 3; i++) {
                elems.push(new SelectableElement(this.gps, this.approachesTable.getElementsByClassName("L" + i)[0], this.approachesCallback.bind(this)));
            }
            let approachPart = this.gps.getChildById("NrstAirportApproaches");
            this.approachesList = new SelectableElementSliderGroup(this.gps, elems, approachPart.getElementsByClassName("Slider")[0], approachPart.getElementsByClassName("SliderCursor")[0]);
        }
        this.defaultSelectables = [
            this.airportList
        ];
        this.currentWaypoint = new WayPoint(this.gps);
        this.currentWaypoint.type = "A";
        this.runwaySelection = new SelectableElement(this.gps, this.runwayDesignation, this.runwayCallback.bind(this));
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.nearestAirportList.Update(25, 200);
        {
            let elems = [];
            for (let i = 0; i < this.nearestAirportList.airports.length; i++) {
                let infos = this.nearestAirportList.airports[i];
                let logo = infos.imageFileName();
                elems.push("<td>" + (this.airportList.getIndex() == i ? '<img src="/Pages/VCockpit/Instruments/NavSystems/Shared/Images/Misc/WhiteArrow.svg">' : "") + "</td><td class=SelectableElement>" + infos.ident + '</td><td><img src="' + (logo == "" ? "" : "/Pages/VCockpit/Instruments/Shared/Map/Images/" + logo) + '"></td><td>' + fastToFixed(infos.bearing, 0) + '°</td><td>' + fastToFixed(infos.distance, 1) + 'NM</td>');
            }
            this.airportList.setStringElements(elems);
        }
        if (this.nearestAirportList.airports.length > this.airportList.getIndex()) {
            let currentNearest = this.nearestAirportList.airports[this.airportList.getIndex()];
            if (currentNearest != undefined) {
                this.currentWaypoint.SetIdent(currentNearest.ident);
                this.currentWaypoint.SetICAO(currentNearest.icao, undefined, false);
            }
        }
        let infos = this.currentWaypoint.GetInfos();
        if (infos && infos.icao != "" && infos.getWaypointType() == "A" && infos.IsUpToDate()) {
            Avionics.Utils.diffAndSet(this.facility, infos.name);
            Avionics.Utils.diffAndSet(this.city, infos.city);
            if (infos.coordinates) {
                Avionics.Utils.diffAndSet(this.elevation, fastToFixed(infos.coordinates.alt, 0) + "FT");
            }
            if (infos.runways) {
                if (this.runwayIndex >= infos.runways.length) {
                    this.runwayIndex = 0;
                }
                Avionics.Utils.diffAndSet(this.runwayDesignation, infos.runways[this.runwayIndex].designation);
                Avionics.Utils.diffAndSet(this.runwaySurface, infos.runways[this.runwayIndex].getSurfaceString());
                Avionics.Utils.diffAndSet(this.runwayLength, fastToFixed(infos.runways[this.runwayIndex].length, 0) + "FT");
                Avionics.Utils.diffAndSet(this.runwayWidth, fastToFixed(infos.runways[this.runwayIndex].width, 0) + "FT");
            }
            if (infos.frequencies) {
                let elems = [];
                for (let i = 0; i < infos.frequencies.length; i++) {
                    elems.push("<td>" + infos.frequencies[i].name + "</td><td class=SelectableElement>" + infos.frequencies[i].mhValue.toFixed(2) + '</td>');
                }
                this.frequenciesList.setStringElements(elems);
            }
            if (infos.approaches) {
                let elems = [];
                for (let i = 0; i < infos.approaches.length; i++) {
                    elems.push("<td class=SelectableElement>" + infos.ident + "-" + infos.approaches[i].name + "</td>");
                }
                this.approachesList.setStringElements(elems);
            }
            this.gps.lastRelevantICAOType = this.currentWaypoint.type;
            this.gps.lastRelevantICAO = infos.icao;
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
    airportCallback(_event, _index) {
    }
    frequenciesCallback(_event, _index) {
        switch (_event) {
            case 'ENT_Push':
                var infos = this.currentWaypoint.GetInfos();
                if (infos.frequencies[_index].mhValue >= 118) {
                    SimVar.SetSimVarValue("K:COM_STBY_RADIO_SET", "Frequency BCD16", infos.frequencies[_index].bcd16Value);
                }
                else {
                    SimVar.SetSimVarValue("K:NAV1_STBY_SET", "Frequency BCD16", infos.frequencies[_index].bcd16Value);
                }
                break;
        }
    }
    approachesCallback(_event, _index) {
    }
    aptSelect() {
        this.gps.ActiveSelection(this.defaultSelectables);
    }
    rnwySelect() {
        this.gps.ActiveSelection([this.runwaySelection]);
    }
    freqSelect() {
        this.gps.ActiveSelection([this.frequenciesList]);
    }
    aprSelect() {
        this.gps.ActiveSelection([this.approachesList]);
    }
    runwayCallback(_event) {
        switch (_event) {
            case "NavigationSmallInc":
                this.runwayIndex = (this.runwayIndex + 1) % this.currentWaypoint.GetInfos().runways.length;
                break;
            case "NavigationSmallDec":
                this.runwayIndex--;
                if (this.runwayIndex < 0) {
                    this.runwayIndex = (this.runwayIndex + 1) % this.currentWaypoint.GetInfos().runways.length;
                }
                break;
        }
    }
}
class MFD_NearestVOR_Element extends NavSystemElement {
    constructor(_nbLines = 11) {
        super();
        this.nbLines = _nbLines;
    }
    init(root) {
        this.facility = root.getElementsByClassName("Facility")[0];
        this.city = root.getElementsByClassName("City")[0];
        this.nearestVorList = new NearestVORList(this.gps);
        {
            this.vorTable = this.gps.getChildById("Nrst_VORList");
            let elems = [];
            for (let i = 1; i <= this.nbLines; i++) {
                elems.push(new SelectableElement(this.gps, this.vorTable.getElementsByClassName("L" + i)[0], this.vorCallback.bind(this)));
            }
            let vorPart = this.gps.getChildById("NrstVORList");
            this.vorList = new SelectableElementSliderGroup(this.gps, elems, vorPart.getElementsByClassName("Slider")[0], vorPart.getElementsByClassName("SliderCursor")[0]);
        }
        this.currentWaypoint = new WayPoint(this.gps);
        this.currentWaypoint.type = "V";
        this.defaultSelectables = [
            this.vorList
        ];
        this.facility = root.getElementsByClassName("Facility")[0];
        this.city = root.getElementsByClassName("City")[0];
        this.class = root.getElementsByClassName("Class")[0];
        this.magvar = root.getElementsByClassName("MagVar")[0];
        this.latitude = root.getElementsByClassName("Latitude")[0];
        this.longitude = root.getElementsByClassName("Longitude")[0];
        this.frequency = root.getElementsByClassName("Frequency")[0];
        this.frequencySelection = new SelectableElement(this.gps, this.frequency, this.frequencyCallback.bind(this));
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.nearestVorList.Update(25, 200);
        {
            let elems = [];
            for (let i = 0; i < this.nearestVorList.vors.length; i++) {
                let infos = this.nearestVorList.vors[i];
                let logo = infos.imageFileName();
                elems.push("<td>" + (this.vorList.getIndex() == i ? '<img src="/Pages/VCockpit/Instruments/NavSystems/Shared/Images/Misc/WhiteArrow.svg">' : "") + "</td><td class=SelectableElement>" + infos.ident + '</td><td><img src="' + (logo == "" ? "" : "/Pages/VCockpit/Instruments/Shared/Map/Images/" + logo) + '"></td><td>' + fastToFixed(infos.bearing, 0) + '°</td><td>' + fastToFixed(infos.distance, 1) + 'NM</td>');
            }
            this.vorList.setStringElements(elems);
        }
        if (this.nearestVorList.vors.length > this.vorList.getIndex()) {
            let currentNearest = this.nearestVorList.vors[this.vorList.getIndex()];
            if (currentNearest != undefined) {
                this.currentWaypoint.SetIdent(currentNearest.ident);
                this.currentWaypoint.SetICAO(currentNearest.icao);
            }
        }
        let infos = this.currentWaypoint.GetInfos();
        if (infos && infos.icao != "" && infos.getWaypointType() == "V" && infos.IsUpToDate()) {
            Avionics.Utils.diffAndSet(this.facility, infos.name);
            Avionics.Utils.diffAndSet(this.city, infos.city);
            Avionics.Utils.diffAndSet(this.class, infos.getClassName());
            let magVar = "";
            if (isNaN(infos.magneticVariation)) {
                magVar = "____°";
            }
            else {
                if (infos.magneticVariation > 0) {
                    magVar = 'W' + fastToFixed(infos.magneticVariation, 0) + "°";
                }
                else {
                    magVar = "E" + fastToFixed((0 - infos.magneticVariation), 0) + "°";
                }
            }
            Avionics.Utils.diffAndSet(this.magvar, magVar);
            if (infos.coordinates) {
                Avionics.Utils.diffAndSet(this.latitude, this.gps.latitudeFormat(infos.coordinates.lat));
                Avionics.Utils.diffAndSet(this.longitude, this.gps.longitudeFormat(infos.coordinates.long));
            }
            Avionics.Utils.diffAndSet(this.frequency, infos.frequencyMHz ? infos.frequencyMHz.toFixed(2) : "___.__");
            this.gps.lastRelevantICAOType = this.currentWaypoint.type;
            this.gps.lastRelevantICAO = infos.icao;
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
    vorCallback(_event, _index) {
    }
    vorSelect() {
        this.gps.ActiveSelection(this.defaultSelectables);
    }
    freqSelect() {
        this.gps.ActiveSelection([this.frequencySelection]);
    }
    frequencyCallback(_event) {
        if (_event == "ENT_Push") {
            SimVar.SetSimVarValue("K:NAV1_STBY_SET", "Frequency BCD16", this.currentWaypoint.GetInfos().frequencyBcd16);
        }
    }
}
class MFD_NearestNDB_Element extends NavSystemElement {
    constructor(_nbLines = 11) {
        super();
        this.nbLines = _nbLines;
    }
    init(root) {
        this.facility = root.getElementsByClassName("Facility")[0];
        this.city = root.getElementsByClassName("City")[0];
        this.nearestNbdList = new NearestNDBList(this.gps);
        {
            this.ndbTable = this.gps.getChildById("Nrst_NDBList");
            let elems = [];
            for (let i = 1; i <= this.nbLines; i++) {
                elems.push(new SelectableElement(this.gps, this.ndbTable.getElementsByClassName("L" + i)[0], this.vorCallback.bind(this)));
            }
            let ndbPart = this.gps.getChildById("NrstNDBList");
            this.ndbList = new SelectableElementSliderGroup(this.gps, elems, ndbPart.getElementsByClassName("Slider")[0], ndbPart.getElementsByClassName("SliderCursor")[0]);
        }
        this.currentWaypoint = new WayPoint(this.gps);
        this.currentWaypoint.type = "N";
        this.defaultSelectables = [
            this.ndbList
        ];
        this.facility = root.getElementsByClassName("Facility")[0];
        this.city = root.getElementsByClassName("City")[0];
        this.class = root.getElementsByClassName("Class")[0];
        this.latitude = root.getElementsByClassName("Latitude")[0];
        this.longitude = root.getElementsByClassName("Longitude")[0];
        this.frequency = root.getElementsByClassName("Frequency")[0];
        this.frequencySelection = new SelectableElement(this.gps, this.frequency, this.frequencyCallback.bind(this));
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.nearestNbdList.Update(25, 200);
        {
            let elems = [];
            for (let i = 0; i < this.nearestNbdList.ndbs.length; i++) {
                let infos = this.nearestNbdList.ndbs[i];
                let logo = infos.imageFileName();
                elems.push("<td>" + (this.ndbList.getIndex() == i ? '<img src="/Pages/VCockpit/Instruments/NavSystems/Shared/Images/Misc/WhiteArrow.svg">' : "") + "</td><td class=SelectableElement>" + infos.ident + '</td><td><img src="' + (logo == "" ? "" : "/Pages/VCockpit/Instruments/Shared/Map/Images/" + logo) + '"></td><td>' + fastToFixed(infos.bearing, 0) + '°</td><td>' + fastToFixed(infos.distance, 1) + 'NM</td>');
            }
            this.ndbList.setStringElements(elems);
        }
        if (this.nearestNbdList.ndbs.length > this.ndbList.getIndex()) {
            let currentNearest = this.nearestNbdList.ndbs[this.ndbList.getIndex()];
            if (currentNearest != undefined && currentNearest.icao != this.currentWaypoint.icao) {
                this.currentWaypoint.SetIdent(currentNearest.ident);
                this.currentWaypoint.SetICAO(currentNearest.icao);
            }
        }
        let infos = this.currentWaypoint.GetInfos();
        if (infos && infos.icao != "" && infos.getWaypointType() == "N" && infos.IsUpToDate()) {
            Avionics.Utils.diffAndSet(this.facility, infos.name);
            Avionics.Utils.diffAndSet(this.city, infos.city);
            Avionics.Utils.diffAndSet(this.class, infos.getTypeString());
            if (infos.coordinates) {
                Avionics.Utils.diffAndSet(this.latitude, this.gps.latitudeFormat(infos.coordinates.lat));
                Avionics.Utils.diffAndSet(this.longitude, this.gps.longitudeFormat(infos.coordinates.long));
            }
            Avionics.Utils.diffAndSet(this.frequency, infos.frequencyMHz.toFixed(2));
            this.gps.lastRelevantICAOType = this.currentWaypoint.type;
            this.gps.lastRelevantICAO = infos.icao;
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
    vorCallback(_event, _index) {
    }
    vorSelect() {
        this.gps.ActiveSelection(this.defaultSelectables);
    }
    freqSelect() {
        this.gps.ActiveSelection([this.frequencySelection]);
    }
    frequencyCallback(_event) {
        if (_event == "ENT_Push") {
        }
    }
}
class MFD_NearestIntersection_Element extends NavSystemElement {
    constructor(_nbLines = 11) {
        super();
        this.nbLines = _nbLines;
    }
    init(root) {
        this.nearestIntList = new NearestIntersectionList(this.gps);
        {
            this.intTable = this.gps.getChildById("Nrst_INTList");
            let elems = [];
            for (let i = 1; i <= this.nbLines; i++) {
                elems.push(new SelectableElement(this.gps, this.intTable.getElementsByClassName("L" + i)[0], this.intCallback.bind(this)));
            }
            let ndbPart = this.gps.getChildById("NrstINTList");
            this.intList = new SelectableElementSliderGroup(this.gps, elems, ndbPart.getElementsByClassName("Slider")[0], ndbPart.getElementsByClassName("SliderCursor")[0]);
        }
        this.currentWaypoint = new WayPoint(this.gps);
        this.currentWaypoint.type = "W";
        this.defaultSelectables = [
            this.intList
        ];
        this.latitude = root.getElementsByClassName("Latitude")[0];
        this.longitude = root.getElementsByClassName("Longitude")[0];
        this.vorIdent = root.getElementsByClassName("VorIdent")[0];
        this.vorSymbol = root.getElementsByClassName("VorSymbol")[0];
        this.vorFreq = root.getElementsByClassName("VorFreq")[0];
        this.vorBearing = root.getElementsByClassName("VorBearing")[0];
        this.vorDistance = root.getElementsByClassName("VorDistance")[0];
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.nearestIntList.Update(25, 200);
        {
            let elems = [];
            for (let i = 0; i < this.nearestIntList.intersections.length; i++) {
                let infos = this.nearestIntList.intersections[i];
                let logo = infos.imageFileName();
                elems.push("<td>" + (this.intList.getIndex() == i ? '<img src="/Pages/VCockpit/Instruments/NavSystems/Shared/Images/Misc/WhiteArrow.svg">' : "") + "</td><td class=SelectableElement>" + infos.ident + '</td><td><img src="' + (logo == "" ? "" : "/Pages/VCockpit/Instruments/Shared/Map/Images/" + logo) + '"></td><td>' + fastToFixed(infos.bearing, 0) + '°</td><td>' + fastToFixed(infos.distance, 1) + 'NM</td>');
            }
            this.intList.setStringElements(elems);
        }
        if (this.nearestIntList.intersections.length > this.intList.getIndex()) {
            let currentNearest = this.nearestIntList.intersections[this.intList.getIndex()];
            if (currentNearest != undefined) {
                this.currentWaypoint.SetIdent(currentNearest.ident);
                this.currentWaypoint.SetICAO(currentNearest.icao);
            }
        }
        let infos = this.currentWaypoint.GetInfos();
        if (infos && infos.icao != "" && infos.getWaypointType() == "W" && infos.IsUpToDate()) {
            if (infos.coordinates) {
                Avionics.Utils.diffAndSet(this.latitude, this.gps.latitudeFormat(infos.coordinates.lat));
                Avionics.Utils.diffAndSet(this.longitude, this.gps.longitudeFormat(infos.coordinates.long));
            }
            Avionics.Utils.diffAndSet(this.vorIdent, infos.nearestVORIdent);
            let logo = infos.vorImageFileNameSync();
            Avionics.Utils.diffAndSetAttribute(this.vorSymbol, "src", (logo == "" ? "" : "/Pages/VCockpit/Instruments/Shared/Map/Images/" + logo));
            Avionics.Utils.diffAndSet(this.vorFreq, infos.nearestVORFrequencyMHz.toFixed(2));
            Avionics.Utils.diffAndSet(this.vorBearing, fastToFixed(infos.nearestVORMagneticRadial, 0) + "°");
            Avionics.Utils.diffAndSet(this.vorDistance, fastToFixed(infos.nearestVORDistance / 1852, 1) + "NM");
            this.gps.lastRelevantICAOType = this.currentWaypoint.type;
            this.gps.lastRelevantICAO = infos.icao;
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
    intCallback(_event, _index) {
    }
}
class MFD_Procedures extends NavSystemElement {
    constructor(_approachSize = 4, _arrivalSize = 6, _departureSize = 6) {
        super();
        this.approachSequenceSize = _approachSize;
        this.arrivalSequenceSize = _arrivalSize;
        this.departureSequenceSize = _departureSize;
    }
    init(root) {
        this.activateVTF = this.gps.getChildById("Proc_ActivateVTF");
        this.activateApproach = this.gps.getChildById("Proc_ActivateApproach");
        this.activateMissedApproach = this.gps.getChildById("Proc_ActivateMissedApproach");
        this.selectApproach = this.gps.getChildById("Proc_SelectApproach");
        this.selectArrival = this.gps.getChildById("Proc_SelectArrival");
        this.selectDeparture = this.gps.getChildById("Proc_SelectDeparture");
        this.loadedApproach = this.gps.getChildById("Proc_loadedApproach");
        this.loadedArrival = this.gps.getChildById("Proc_loadedArrival");
        this.loadedDeparture = this.gps.getChildById("Proc_loadedDeparture");
        this.selectApproachPopup = new NavSystemElementContainer("ApproachSelection", "ApproachSelection", new MFD_ApproachSelection(this.approachSequenceSize));
        this.selectApproachPopup.setGPS(this.gps);
        this.selectArrivalPopup = new NavSystemElementContainer("ArrivalSelection", "ArrivalSelection", new MFD_ArrivalSelection(this.arrivalSequenceSize));
        this.selectArrivalPopup.setGPS(this.gps);
        this.selectDeparturePopup = new NavSystemElementContainer("DepartureSelection", "DepartureSelection", new MFD_DepartureSelection(this.departureSequenceSize));
        this.selectDeparturePopup.setGPS(this.gps);
        this.activateApproach_SE = new SelectableElement(this.gps, this.activateApproach, this.activateApproach_CB.bind(this));
        this.defaultSelectables = [
            this.activateApproach_SE,
            new SelectableElement(this.gps, this.selectApproach, this.selectApproach_CB.bind(this)),
            new SelectableElement(this.gps, this.selectArrival, this.selectArrival_CB.bind(this)),
            new SelectableElement(this.gps, this.selectDeparture, this.selectDeparture_CB.bind(this)),
        ];
        this.root = root;
    }
    onEnter() {
        this.root.setAttribute("state", "Active");
        this.gps.currFlightPlanManager.updateFlightPlan(() => {
            this.gps.currFlightPlanManager.updateCurrentApproach();
        });
        this.gps.ActiveSelection(this.defaultSelectables);
    }
    onUpdate(_deltaTime) {
        this.activateApproach_SE.setActive(this.gps.currFlightPlanManager.isLoadedApproach() && !this.gps.currFlightPlanManager.isActiveApproach());
        let approach = this.gps.currFlightPlanManager.getAirportApproach();
        if (approach) {
            Avionics.Utils.diffAndSet(this.loadedApproach, approach.name);
        }
        else {
            Avionics.Utils.diffAndSet(this.loadedApproach, "____-");
        }
        let departure = this.gps.currFlightPlanManager.getDeparture();
        if (departure) {
            Avionics.Utils.diffAndSet(this.loadedDeparture, departure.name);
        }
        else {
            Avionics.Utils.diffAndSet(this.loadedDeparture, "____-");
        }
        let arrival = this.gps.currFlightPlanManager.getArrival();
        if (arrival) {
            Avionics.Utils.diffAndSet(this.loadedArrival, arrival.name);
        }
        else {
            Avionics.Utils.diffAndSet(this.loadedArrival, "____-");
        }
    }
    onExit() {
        this.root.setAttribute("state", "Inactive");
        this.gps.SwitchToInteractionState(0);
    }
    onEvent(_event) {
    }
    activateApproach_CB(_event) {
        if (_event == "ENT_Push") {
            this.gps.currFlightPlanManager.activateApproach();
            this.gps.closePopUpElement();
        }
    }
    selectApproach_CB(_event) {
        if (_event == "ENT_Push") {
            this.gps.switchToPopUpPage(this.selectApproachPopup);
        }
    }
    selectArrival_CB(_event) {
        if (_event == "ENT_Push") {
            this.gps.switchToPopUpPage(this.selectArrivalPopup);
        }
    }
    selectDeparture_CB(_event) {
        if (_event == "ENT_Push") {
            this.gps.switchToPopUpPage(this.selectDeparturePopup);
        }
    }
}
class MFD_ApproachSelection extends NavSystemElement {
    constructor(_nbLines = 4) {
        super();
        this.selectedApproach = 0;
        this.selectedTransition = 0;
        this.nbLines = _nbLines;
    }
    init(root) {
        this.root = root;
        this.elem_airportID = this.gps.getChildById("Approach_AirportID");
        this.elem_airportLogo = this.gps.getChildById("Approach_AirportLogo");
        this.elem_airportType = this.gps.getChildById("Approach_AirportType");
        this.elem_airportName = this.gps.getChildById("Approach_AirportName");
        this.elem_airportCity = this.gps.getChildById("Approach_AirportCity");
        this.elem_channel = this.gps.getChildById("Approach_Channel");
        this.elem_id = this.gps.getChildById("Approach_Id");
        this.elem_approach = this.gps.getChildById("Approach_Approach");
        this.elem_transition = this.gps.getChildById("Approach_Transition");
        this.elem_minimumsState = this.gps.getChildById("Approach_MinimumsState");
        this.elem_minimumsValue = this.gps.getChildById("Approach_MinimumsValue");
        this.elem_frequencyName = this.gps.getChildById("Approach_FrequencyName");
        this.elem_frequencyValue = this.gps.getChildById("Approach_FrequencyValue");
        this.elem_sequence = this.gps.getChildById("Approach_Sequence");
        if (this.elem_sequence) {
            if (this.nbLines == 0) {
                root.getElementsByClassName("Sequence")[0].style.display = "none";
            }
            this.sequenceSlider = this.elem_sequence.getElementsByClassName("Slider")[0];
            this.sequenceSliderCursor = this.sequenceSlider.getElementsByClassName("SliderCursor")[0];
        }
        this.elem_sequenceTable = this.gps.getChildById("Approach_SequenceTable");
        this.elem_loadButton = this.gps.getChildById("Approach_LoadButton");
        this.elem_activateButton = this.gps.getChildById("Approach_ActivateButton");
        this.approachList = this.gps.getChildById("Approach_ApproachList");
        this.approachLines = [];
        this.transitionList = this.gps.getChildById("Approach_TransitionList");
        this.transitionLines = [];
        this.icaoSearchField = new SearchFieldWaypointICAO(this.gps, [this.elem_airportID], this.gps, "A");
        if (this.elem_airportName) {
            this.nameSearchField = new SearchFieldWaypointName(this.gps, [this.elem_airportName], this.gps, "A", this.icaoSearchField);
        }
        if (this.elem_sequence && this.nbLines > 0) {
            let sliderGroupElements = new Array();
            for (let i = 1; i <= this.nbLines; i++) {
                sliderGroupElements.push(new SelectableElement(this.gps, this.elem_sequenceTable.getElementsByClassName("L" + i)[0], this.sequenceLineCallback.bind(this, i)));
            }
            this.sequenceSliderGroup = new SelectableElementSliderGroup(this.gps, sliderGroupElements, this.sequenceSlider, this.sequenceSliderCursor);
        }
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.elem_approach, this.openApproachList.bind(this)),
            new SelectableElement(this.gps, this.elem_transition, this.openTransitionList.bind(this)),
        ];
        if (this.elem_sequence && this.nbLines > 0) {
            this.defaultSelectables.push(this.sequenceSliderGroup);
        }
        this.defaultSelectables.push(new SelectableElement(this.gps, this.elem_loadButton, this.loadApproach.bind(this)));
        this.defaultSelectables.push(new SelectableElement(this.gps, this.elem_activateButton, this.activateApproach.bind(this)));
    }
    loadApproach(_event) {
        if (_event == "ENT_Push") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao) {
                this.gps.currFlightPlanManager.setApproachIndex(this.selectedApproach, () => {
                    let elem = this.gps.getElementOfType(MFD_ActiveFlightPlan_Element);
                    if (elem) {
                        elem.updateWaypoints();
                    }
                }, this.selectedTransition);
            }
            this.gps.closePopUpElement();
        }
    }
    activateApproach(_event) {
        if (_event == "ENT_Push") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao) {
                this.gps.currFlightPlanManager.setApproachIndex(this.selectedApproach, () => {
                    let elem = this.gps.getElementOfType(MFD_ActiveFlightPlan_Element);
                    if (elem) {
                        elem.updateWaypoints();
                    }
                }, this.selectedTransition);
                this.gps.currFlightPlanManager.activateApproach();
            }
            this.gps.closePopUpElement();
        }
    }
    sequenceLineCallback(_index, _event) {
    }
    activateIcaoSearch(_event) {
        if (_event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.icaoSearchField.StartSearch();
            this.gps.SwitchToInteractionState(3);
            this.selectedApproach = 0;
            this.selectedTransition = 0;
        }
    }
    activateNameSearch(_event) {
        if (_event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            this.gps.currentSearchFieldWaypoint = this.nameSearchField;
            this.nameSearchField.StartSearch();
            this.gps.SwitchToInteractionState(3);
        }
    }
    openApproachList(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            let nbElems = 0;
            this.approachSelectables = [];
            if (infos && infos.icao) {
                for (let i = 0; i < infos.approaches.length; i++) {
                    if (i >= this.approachLines.length) {
                        this.approachLines.push(document.createElement("div"));
                        this.approachList.appendChild(this.approachLines[i]);
                    }
                    Avionics.Utils.diffAndSet(this.approachLines[i], infos.approaches[i].name);
                    Avionics.Utils.diffAndSetAttribute(this.approachLines[i], "state", "Active");
                    Avionics.Utils.diffAndSetAttribute(this.approachLines[i], "class", "Blinking");
                    this.approachSelectables.push(new SelectableElement(this.gps, this.approachLines[i], this.selectApproach.bind(this, i)));
                }
                nbElems = infos.approaches.length;
            }
            for (let i = nbElems; i < this.approachLines.length; i++) {
                Avionics.Utils.diffAndSetAttribute(this.approachLines[i], "state", "Inactive");
            }
            if (this.approachSelectables.length > 0) {
                this.approachList.setAttribute("state", "Active");
                this.gps.ActiveSelection(this.approachSelectables);
            }
        }
    }
    selectApproach(_id, _event) {
        if (_event == "ENT_Push") {
            this.approachList.setAttribute("state", "Inactive");
            this.selectedApproach = _id;
            this.gps.SwitchToInteractionState(0);
            this.selectedTransition = 0;
        }
    }
    openTransitionList(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            let nbElems = 0;
            this.transitionSelectables = [];
            if (infos && infos.icao && infos.approaches.length > this.selectedApproach && infos.approaches[this.selectedApproach].transitions.length > 0) {
                for (let i = 0; i < infos.approaches[this.selectedApproach].transitions.length; i++) {
                    if (i >= this.transitionLines.length) {
                        this.transitionLines.push(document.createElement("div"));
                        this.transitionList.appendChild(this.transitionLines[i]);
                    }
                    Avionics.Utils.diffAndSet(this.transitionLines[i], infos.approaches[this.selectedApproach].transitions[i].name);
                    Avionics.Utils.diffAndSetAttribute(this.transitionLines[i], "state", "Active");
                    Avionics.Utils.diffAndSetAttribute(this.transitionLines[i], "class", "Blinking");
                    this.transitionSelectables.push(new SelectableElement(this.gps, this.transitionLines[i], this.selectTransition.bind(this, i)));
                }
                nbElems = infos.approaches[this.selectedApproach].transitions.length;
            }
            for (let i = nbElems; i < this.transitionLines.length; i++) {
                Avionics.Utils.diffAndSetAttribute(this.transitionLines[i], "state", "Inactive");
            }
            if (this.transitionSelectables.length > 0) {
                this.transitionList.setAttribute("state", "Active");
                this.gps.ActiveSelection(this.transitionSelectables);
            }
        }
    }
    selectTransition(_id, _event) {
        if (_event == "ENT_Push") {
            this.transitionList.setAttribute("state", "Inactive");
            this.selectedTransition = _id;
            this.gps.SwitchToInteractionState(0);
        }
    }
    onEnter() {
        this.root.setAttribute("state", "Active");
        this.gps.ActiveSelection(this.defaultSelectables);
        let dest = this.gps.currFlightPlanManager.getDestination();
        if (dest) {
            this.icaoSearchField.SetWaypoint("A", dest.icao);
            let index = this.gps.currFlightPlanManager.getApproachIndex();
            if (index >= 0) {
                this.selectedApproach = index;
                this.gps.cursorIndex = 1;
            }
        }
    }
    onUpdate(_deltaTime) {
        if (this.elem_airportName) {
            this.nameSearchField.Update();
        }
        this.icaoSearchField.Update();
        if (this.elem_sequence && this.nbLines > 0) {
            this.sequenceSliderGroup.updateDisplay();
        }
        let infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao) {
            Avionics.Utils.diffAndSet(this.elem_airportCity, infos.city);
            switch (infos.privateType) {
                case 0:
                    Avionics.Utils.diffAndSet(this.elem_airportType, "Unknown");
                    break;
                case 1:
                    Avionics.Utils.diffAndSet(this.elem_airportType, "Public");
                    break;
                case 2:
                    Avionics.Utils.diffAndSet(this.elem_airportType, "Military");
                    break;
                case 3:
                    Avionics.Utils.diffAndSet(this.elem_airportType, "Private");
                    break;
            }
            var logo = infos.imageFileName();
            if (logo != "") {
                Avionics.Utils.diffAndSetAttribute(this.elem_airportLogo, "src", "/Pages/VCockpit/Instruments/Shared/Map/Images/" + logo);
            }
            else {
                Avionics.Utils.diffAndSetAttribute(this.elem_airportLogo, "src", "");
            }
            if (infos.approaches.length > this.selectedApproach) {
                Avionics.Utils.diffAndSet(this.elem_approach, infos.approaches[this.selectedApproach].name);
                if (infos.approaches[this.selectedApproach].transitions.length > this.selectedTransition) {
                    Avionics.Utils.diffAndSet(this.elem_transition, infos.approaches[this.selectedApproach].transitions[this.selectedTransition].name);
                }
                else {
                    Avionics.Utils.diffAndSet(this.elem_transition, "NONE");
                }
            }
            else {
                Avionics.Utils.diffAndSet(this.elem_approach, "NONE");
                Avionics.Utils.diffAndSet(this.elem_transition, "NONE");
            }
            if (this.elem_sequence && this.nbLines > 0) {
                let sequence = [];
                if (infos.approaches.length > this.selectedApproach) {
                    if (infos.approaches[this.selectedApproach].transitions.length > this.selectedTransition) {
                        for (let i = 0; i < infos.approaches[this.selectedApproach].transitions[this.selectedTransition].waypoints.length; i++) {
                            if (infos.approaches[this.selectedApproach].transitions[this.selectedTransition].waypoints[i] != undefined) {
                                sequence.push('<td class="Blinking">' + infos.approaches[this.selectedApproach].transitions[this.selectedTransition].waypoints[i].infos.ident + "</td><td>"
                                    + " " + "</td><td>"
                                    + " " + "</td><td>"
                                    + (infos.approaches[this.selectedApproach].transitions[this.selectedTransition].waypoints[i].bearingInFP ? infos.approaches[this.selectedApproach].transitions[this.selectedTransition].waypoints[i].bearingInFP.toFixed(0) + "°" : "") + "</td><td>"
                                    + (infos.approaches[this.selectedApproach].transitions[this.selectedTransition].waypoints[i].distanceInFP ? infos.approaches[this.selectedApproach].transitions[this.selectedTransition].waypoints[i].distanceInFP.toFixed(1) + "NM" : "") + "</td>");
                            }
                        }
                    }
                    for (let i = 0; i < infos.approaches[this.selectedApproach].wayPoints.length; i++) {
                        sequence.push('<td class="Blinking">' + infos.approaches[this.selectedApproach].wayPoints[i].ident + "</td><td>"
                            + " " + "</td><td>"
                            + " " + "</td><td>"
                            + infos.approaches[this.selectedApproach].wayPoints[i].bearingInFP.toFixed(0) + "°" + "</td><td>"
                            + infos.approaches[this.selectedApproach].wayPoints[i].distanceInFP.toFixed(1) + "NM" + "</td>");
                    }
                    this.sequenceSliderGroup.setStringElements(sequence);
                }
                else {
                    this.sequenceSliderGroup.setStringElements([]);
                }
            }
        }
        else {
            Avionics.Utils.diffAndSet(this.elem_airportCity, "____________");
            Avionics.Utils.diffAndSet(this.elem_airportType, "Unknown");
            Avionics.Utils.diffAndSetAttribute(this.elem_airportLogo, "src", "");
            if (this.elem_sequence && this.nbLines > 0) {
                this.sequenceSliderGroup.setStringElements([]);
            }
        }
    }
    onExit() {
        this.root.setAttribute("state", "Inactive");
        this.gps.currFlightPlanManager.updateFlightPlan(() => {
            this.gps.currFlightPlanManager.updateCurrentApproach();
        });
        this.gps.SwitchToInteractionState(0);
    }
    onEvent(_event) {
        if (_event == "NavigationPush") {
            this.approachList.setAttribute("state", "Inactive");
            this.transitionList.setAttribute("state", "Inactive");
        }
    }
}
class MFD_ArrivalSelection extends NavSystemElement {
    constructor(_nbLines = 6) {
        super();
        this.selectedArrival = 0;
        this.selectedTransition = 0;
        this.selectedRunway = 0;
        this.nbLines = _nbLines;
    }
    init(root) {
        this.root = root;
        this.elem_airportID = this.gps.getChildById("Arrival_AirportID");
        this.elem_airportLogo = this.gps.getChildById("Arrival_AirportLogo");
        this.elem_airportType = this.gps.getChildById("Arrival_AirportType");
        this.elem_airportName = this.gps.getChildById("Arrival_AirportName");
        this.elem_airportCity = this.gps.getChildById("Arrival_AirportCity");
        this.elem_arrival = this.gps.getChildById("Arrival_Arrival");
        this.elem_transition = this.gps.getChildById("Arrival_Transition");
        this.elem_runway = this.gps.getChildById("Arrival_Runway");
        this.elem_sequence = this.gps.getChildById("Arrival_Sequence");
        if (this.elem_sequence) {
            if (this.nbLines == 0) {
                root.getElementsByClassName("Sequence")[0].style.display = "none";
            }
            this.sequenceSlider = this.elem_sequence.getElementsByClassName("Slider")[0];
            this.sequenceSliderCursor = this.sequenceSlider.getElementsByClassName("SliderCursor")[0];
        }
        this.elem_sequenceTable = this.gps.getChildById("Arrival_SequenceTable");
        this.elem_loadButton = this.gps.getChildById("Arrival_LoadButton");
        this.arrivalList = this.gps.getChildById("Arrival_ArrivalList");
        this.transitionList = this.gps.getChildById("Arrival_TransitionList");
        this.transitionLines = [];
        this.runwayList = this.gps.getChildById("Arrival_RunwayList");
        this.runwayLines = [];
        this.icaoSearchField = new SearchFieldWaypointICAO(this.gps, [this.elem_airportID], this.gps, "A");
        if (this.elem_airportName) {
            this.nameSearchField = new SearchFieldWaypointName(this.gps, [this.elem_airportName], this.gps, "A", this.icaoSearchField);
        }
        if (this.elem_sequence && this.nbLines > 0) {
            let sliderGroupElements = new Array();
            for (let i = 1; i <= this.nbLines; i++) {
                sliderGroupElements.push(new SelectableElement(this.gps, this.elem_sequenceTable.getElementsByClassName("L" + i)[0], this.sequenceLineCallback.bind(this, i)));
            }
            this.sequenceSliderGroup = new SelectableElementSliderGroup(this.gps, sliderGroupElements, this.sequenceSlider, this.sequenceSliderCursor);
        }
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.elem_arrival, this.openArrivalList.bind(this)),
            new SelectableElement(this.gps, this.elem_transition, this.openTransitionList.bind(this)),
            new SelectableElement(this.gps, this.elem_runway, this.openRunwaysList.bind(this)),
        ];
        if (this.elem_sequence && this.nbLines > 0) {
            this.defaultSelectables.push(this.sequenceSliderGroup);
        }
        this.defaultSelectables.push(new SelectableElement(this.gps, this.elem_loadButton, this.loadArrival.bind(this)));
        this.arrivalSelectableSliderGroup = new SelectableElementSliderGroup(this.gps, [
            new SelectableElement(this.gps, this.arrivalList.getElementsByClassName("L1")[0], this.selectArrival.bind(this, 0)),
            new SelectableElement(this.gps, this.arrivalList.getElementsByClassName("L2")[0], this.selectArrival.bind(this, 1)),
            new SelectableElement(this.gps, this.arrivalList.getElementsByClassName("L3")[0], this.selectArrival.bind(this, 2)),
            new SelectableElement(this.gps, this.arrivalList.getElementsByClassName("L4")[0], this.selectArrival.bind(this, 3)),
            new SelectableElement(this.gps, this.arrivalList.getElementsByClassName("L5")[0], this.selectArrival.bind(this, 4)),
            new SelectableElement(this.gps, this.arrivalList.getElementsByClassName("L6")[0], this.selectArrival.bind(this, 5)),
            new SelectableElement(this.gps, this.arrivalList.getElementsByClassName("L7")[0], this.selectArrival.bind(this, 6)),
            new SelectableElement(this.gps, this.arrivalList.getElementsByClassName("L8")[0], this.selectArrival.bind(this, 7)),
            new SelectableElement(this.gps, this.arrivalList.getElementsByClassName("L9")[0], this.selectArrival.bind(this, 8)),
            new SelectableElement(this.gps, this.arrivalList.getElementsByClassName("L10")[0], this.selectArrival.bind(this, 9)),
        ], this.arrivalList.getElementsByClassName("Slider")[0], this.arrivalList.getElementsByClassName("SliderCursor")[0]);
        this.arrivalSelectables = [this.arrivalSelectableSliderGroup];
    }
    loadArrival(_event) {
        if (_event == "ENT_Push") {
            this.gps.currFlightPlanManager.setArrivalProcIndex(this.selectedArrival);
            this.gps.currFlightPlanManager.setArrivalRunwayIndex(this.selectedRunway);
            this.gps.currFlightPlanManager.setArrivalEnRouteTransitionIndex(this.selectedTransition);
            this.gps.closePopUpElement();
        }
    }
    sequenceLineCallback(_index, _event) {
    }
    activateIcaoSearch(_event) {
        if (_event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.icaoSearchField.StartSearch();
            this.gps.SwitchToInteractionState(3);
            this.selectedArrival = 0;
            this.selectedTransition = 0;
        }
    }
    activateNameSearch(_event) {
        if (_event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            this.gps.currentSearchFieldWaypoint = this.nameSearchField;
            this.nameSearchField.StartSearch();
            this.gps.SwitchToInteractionState(3);
        }
    }
    openArrivalList(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            let strings = [];
            if (infos && infos.icao) {
                for (let i = 0; i < infos.arrivals.length; i++) {
                    strings.push(infos.arrivals[i].name);
                }
                this.arrivalSelectableSliderGroup.setStringElements(strings);
            }
            if (strings.length > 0) {
                this.arrivalList.setAttribute("state", "Active");
                this.gps.ActiveSelection(this.arrivalSelectables);
            }
        }
    }
    selectArrival(_id, _event) {
        if (_event == "ENT_Push") {
            this.arrivalList.setAttribute("state", "Inactive");
            this.selectedArrival = _id + this.arrivalSelectableSliderGroup.getOffset();
            this.gps.SwitchToInteractionState(0);
            this.selectedTransition = 0;
            this.selectedRunway = 0;
        }
    }
    openTransitionList(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            let nbElems = 0;
            this.transitionSelectables = [];
            if (infos && infos.icao && infos.arrivals.length > this.selectedArrival && infos.arrivals[this.selectedArrival].enRouteTransitions.length > 0) {
                for (let i = 0; i < infos.arrivals[this.selectedArrival].enRouteTransitions.length; i++) {
                    if (i >= this.transitionLines.length) {
                        this.transitionLines.push(document.createElement("div"));
                        this.transitionList.appendChild(this.transitionLines[i]);
                    }
                    Avionics.Utils.diffAndSet(this.transitionLines[i], infos.arrivals[this.selectedArrival].enRouteTransitions[i].name);
                    Avionics.Utils.diffAndSetAttribute(this.transitionLines[i], "state", "Active");
                    Avionics.Utils.diffAndSetAttribute(this.transitionLines[i], "class", "Blinking");
                    this.transitionSelectables.push(new SelectableElement(this.gps, this.transitionLines[i], this.selectTransition.bind(this, i)));
                }
                nbElems = infos.arrivals[this.selectedArrival].enRouteTransitions.length;
            }
            for (let i = nbElems; i < this.transitionLines.length; i++) {
                Avionics.Utils.diffAndSetAttribute(this.transitionLines[i], "state", "Inactive");
            }
            if (this.transitionSelectables.length > 0) {
                this.transitionList.setAttribute("state", "Active");
                this.gps.ActiveSelection(this.transitionSelectables);
            }
        }
    }
    selectTransition(_id, _event) {
        if (_event == "ENT_Push") {
            this.transitionList.setAttribute("state", "Inactive");
            this.selectedTransition = _id;
            this.gps.SwitchToInteractionState(0);
        }
    }
    openRunwaysList(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            let nbElems = 0;
            this.runwaySelectables = [];
            if (infos && infos.icao && infos.arrivals.length > this.selectedArrival && infos.arrivals[this.selectedArrival].runwayTransitions.length > 0) {
                for (let i = 0; i < infos.arrivals[this.selectedArrival].runwayTransitions.length; i++) {
                    if (i >= this.runwayLines.length) {
                        this.runwayLines.push(document.createElement("div"));
                        this.runwayList.appendChild(this.runwayLines[i]);
                    }
                    Avionics.Utils.diffAndSet(this.runwayLines[i], infos.arrivals[this.selectedArrival].runwayTransitions[i].name);
                    Avionics.Utils.diffAndSetAttribute(this.runwayLines[i], "state", "Active");
                    Avionics.Utils.diffAndSetAttribute(this.runwayLines[i], "class", "Blinking");
                    this.runwaySelectables.push(new SelectableElement(this.gps, this.runwayLines[i], this.selectRunway.bind(this, i)));
                }
                nbElems = infos.arrivals[this.selectedArrival].runwayTransitions.length;
            }
            for (let i = nbElems; i < this.runwayLines.length; i++) {
                Avionics.Utils.diffAndSetAttribute(this.runwayLines[i], "state", "Inactive");
            }
            if (this.runwaySelectables.length > 0) {
                this.runwayList.setAttribute("state", "Active");
                this.gps.ActiveSelection(this.runwaySelectables);
            }
        }
    }
    selectRunway(_id, _event) {
        if (_event == "ENT_Push") {
            this.runwayList.setAttribute("state", "Inactive");
            this.selectedRunway = _id;
            this.gps.SwitchToInteractionState(0);
        }
    }
    onEnter() {
        this.root.setAttribute("state", "Active");
        this.gps.ActiveSelection(this.defaultSelectables);
        let dest = this.gps.currFlightPlanManager.getDestination();
        if (dest) {
            this.icaoSearchField.SetWaypoint("A", dest.icao);
            let index = this.gps.currFlightPlanManager.getArrivalProcIndex();
            if (index >= 0) {
                this.selectedArrival = index;
                this.gps.cursorIndex = 1;
            }
        }
    }
    onUpdate(_deltaTime) {
        if (this.elem_airportName) {
            this.nameSearchField.Update();
        }
        this.icaoSearchField.Update();
        if (this.elem_sequence && this.nbLines > 0) {
            this.sequenceSliderGroup.updateDisplay();
        }
        let infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao) {
            Avionics.Utils.diffAndSet(this.elem_airportCity, infos.city);
            switch (infos.privateType) {
                case 0:
                    Avionics.Utils.diffAndSet(this.elem_airportType, "Unknown");
                    break;
                case 1:
                    Avionics.Utils.diffAndSet(this.elem_airportType, "Public");
                    break;
                case 2:
                    Avionics.Utils.diffAndSet(this.elem_airportType, "Military");
                    break;
                case 3:
                    Avionics.Utils.diffAndSet(this.elem_airportType, "Private");
                    break;
            }
            var logo = infos.imageFileName();
            if (logo != "") {
                Avionics.Utils.diffAndSetAttribute(this.elem_airportLogo, "src", "/Pages/VCockpit/Instruments/Shared/Map/Images/" + logo);
            }
            else {
                Avionics.Utils.diffAndSetAttribute(this.elem_airportLogo, "src", "");
            }
            if (infos.arrivals.length > this.selectedArrival) {
                Avionics.Utils.diffAndSet(this.elem_arrival, infos.arrivals[this.selectedArrival].name);
                if (infos.arrivals[this.selectedArrival].enRouteTransitions.length > this.selectedTransition) {
                    Avionics.Utils.diffAndSet(this.elem_transition, infos.arrivals[this.selectedArrival].enRouteTransitions[this.selectedTransition].name);
                }
                else {
                    Avionics.Utils.diffAndSet(this.elem_transition, "NONE");
                }
                if (infos.arrivals[this.selectedArrival].runwayTransitions.length > this.selectedRunway) {
                    Avionics.Utils.diffAndSet(this.elem_runway, infos.arrivals[this.selectedArrival].runwayTransitions[this.selectedRunway].name);
                }
                else {
                    Avionics.Utils.diffAndSet(this.elem_runway, "ALL");
                }
            }
            else {
                Avionics.Utils.diffAndSet(this.elem_arrival, "NONE");
                Avionics.Utils.diffAndSet(this.elem_transition, "NONE");
            }
            if (this.elem_sequence && this.nbLines > 0) {
                let sequence = [];
                if (infos.arrivals.length > this.selectedArrival) {
                    if (infos.arrivals[this.selectedArrival].runwayTransitions.length > this.selectedRunway) {
                        for (let i = 0; i < infos.arrivals[this.selectedArrival].runwayTransitions[this.selectedRunway].legs.length; i++) {
                            sequence.push('<td class="Blinking">' + infos.arrivals[this.selectedArrival].runwayTransitions[this.selectedRunway].legs[i].fixIcao.substr(7, 5) + "</td><td>"
                                + " " + "</td><td>"
                                + " " + "</td><td>"
                                + infos.arrivals[this.selectedArrival].runwayTransitions[this.selectedRunway].legs[i].course.toFixed(0) + "°" + "</td><td>"
                                + infos.arrivals[this.selectedArrival].runwayTransitions[this.selectedRunway].legs[i].distance.toFixed(1) + "NM" + "</td>");
                        }
                    }
                    for (let i = 0; i < infos.arrivals[this.selectedArrival].commonLegs.length; i++) {
                        sequence.push('<td class="Blinking">' + infos.arrivals[this.selectedArrival].commonLegs[i].fixIcao.substr(7, 5) + "</td><td>"
                            + " " + "</td><td>"
                            + " " + "</td><td>"
                            + infos.arrivals[this.selectedArrival].commonLegs[i].course.toFixed(0) + "°" + "</td><td>"
                            + infos.arrivals[this.selectedArrival].commonLegs[i].distance.toFixed(1) + "NM" + "</td>");
                    }
                    if (infos.arrivals[this.selectedArrival].enRouteTransitions.length > this.selectedTransition) {
                        for (let i = 0; i < infos.arrivals[this.selectedArrival].enRouteTransitions[this.selectedTransition].legs.length; i++) {
                            sequence.push('<td class="Blinking">' + infos.arrivals[this.selectedArrival].enRouteTransitions[this.selectedTransition].legs[i].fixIcao.substr(7, 5) + "</td><td>"
                                + " " + "</td><td>"
                                + " " + "</td><td>"
                                + infos.arrivals[this.selectedArrival].enRouteTransitions[this.selectedTransition].legs[i].course.toFixed(0) + "°" + "</td><td>"
                                + infos.arrivals[this.selectedArrival].enRouteTransitions[this.selectedTransition].legs[i].distance.toFixed(1) + "NM" + "</td>");
                        }
                    }
                    this.sequenceSliderGroup.setStringElements(sequence);
                }
                else {
                    this.sequenceSliderGroup.setStringElements([]);
                }
            }
        }
        else {
            Avionics.Utils.diffAndSet(this.elem_airportCity, "____________");
            Avionics.Utils.diffAndSet(this.elem_airportType, "Unknown");
            Avionics.Utils.diffAndSetAttribute(this.elem_airportLogo, "src", "");
            this.sequenceSliderGroup.setStringElements([]);
        }
    }
    onExit() {
        this.root.setAttribute("state", "Inactive");
        this.gps.currFlightPlanManager.updateFlightPlan(() => {
            this.gps.currFlightPlanManager.updateCurrentApproach();
        });
        this.gps.SwitchToInteractionState(0);
    }
    onEvent(_event) {
        if (_event == "NavigationPush") {
            this.arrivalList.setAttribute("state", "Inactive");
            this.transitionList.setAttribute("state", "Inactive");
            this.runwayList.setAttribute("state", "Inactive");
        }
    }
}
class MFD_DepartureSelection extends NavSystemElement {
    constructor(_nbLines = 6) {
        super();
        this.selectedDeparture = 0;
        this.selectedTransition = 0;
        this.selectedRunway = 0;
        this.nbLines = _nbLines;
    }
    init(root) {
        this.root = root;
        this.elem_airportID = this.gps.getChildById("Departure_AirportID");
        this.elem_airportLogo = this.gps.getChildById("Departure_AirportLogo");
        this.elem_airportType = this.gps.getChildById("Departure_AirportType");
        this.elem_airportName = this.gps.getChildById("Departure_AirportName");
        this.elem_airportCity = this.gps.getChildById("Departure_AirportCity");
        this.elem_departure = this.gps.getChildById("Departure_Departure");
        this.elem_transition = this.gps.getChildById("Departure_Transition");
        this.elem_runway = this.gps.getChildById("Departure_Runway");
        this.elem_sequence = this.gps.getChildById("Departure_Sequence");
        if (this.elem_sequence) {
            if (this.nbLines == 0) {
                root.getElementsByClassName("Sequence")[0].style.display = "none";
            }
            this.sequenceSlider = this.elem_sequence.getElementsByClassName("Slider")[0];
            this.sequenceSliderCursor = this.sequenceSlider.getElementsByClassName("SliderCursor")[0];
        }
        this.elem_sequenceTable = this.gps.getChildById("Departure_SequenceTable");
        this.elem_loadButton = this.gps.getChildById("Departure_LoadButton");
        this.departureList = this.gps.getChildById("Departure_DepartureList");
        this.transitionList = this.gps.getChildById("Departure_TransitionList");
        this.transitionLines = [];
        this.runwayList = this.gps.getChildById("Departure_RunwayList");
        this.runwayLines = [];
        this.icaoSearchField = new SearchFieldWaypointICAO(this.gps, [this.elem_airportID], this.gps, "A");
        if (this.elem_airportName) {
            this.nameSearchField = new SearchFieldWaypointName(this.gps, [this.elem_airportName], this.gps, "A", this.icaoSearchField);
        }
        if (this.elem_sequence && this.nbLines > 0) {
            let sliderGroupElements = new Array();
            for (let i = 1; i <= this.nbLines; i++) {
                sliderGroupElements.push(new SelectableElement(this.gps, this.elem_sequenceTable.getElementsByClassName("L" + i)[0], this.sequenceLineCallback.bind(this, i)));
            }
            this.sequenceSliderGroup = new SelectableElementSliderGroup(this.gps, sliderGroupElements, this.sequenceSlider, this.sequenceSliderCursor);
        }
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.elem_departure, this.openDepartureList.bind(this)),
            new SelectableElement(this.gps, this.elem_transition, this.openTransitionList.bind(this)),
            new SelectableElement(this.gps, this.elem_runway, this.openRunwaysList.bind(this)),
        ];
        if (this.elem_sequence && this.nbLines > 0) {
            this.defaultSelectables.push(this.sequenceSliderGroup);
        }
        this.defaultSelectables.push(new SelectableElement(this.gps, this.elem_loadButton, this.loadDeparture.bind(this)));
        this.departureSelectableSliderGroup = new SelectableElementSliderGroup(this.gps, [
            new SelectableElement(this.gps, this.departureList.getElementsByClassName("L1")[0], this.selectDeparture.bind(this, 0)),
            new SelectableElement(this.gps, this.departureList.getElementsByClassName("L2")[0], this.selectDeparture.bind(this, 1)),
            new SelectableElement(this.gps, this.departureList.getElementsByClassName("L3")[0], this.selectDeparture.bind(this, 2)),
            new SelectableElement(this.gps, this.departureList.getElementsByClassName("L4")[0], this.selectDeparture.bind(this, 3)),
            new SelectableElement(this.gps, this.departureList.getElementsByClassName("L5")[0], this.selectDeparture.bind(this, 4)),
            new SelectableElement(this.gps, this.departureList.getElementsByClassName("L6")[0], this.selectDeparture.bind(this, 5)),
            new SelectableElement(this.gps, this.departureList.getElementsByClassName("L7")[0], this.selectDeparture.bind(this, 6)),
            new SelectableElement(this.gps, this.departureList.getElementsByClassName("L8")[0], this.selectDeparture.bind(this, 7)),
            new SelectableElement(this.gps, this.departureList.getElementsByClassName("L9")[0], this.selectDeparture.bind(this, 8)),
            new SelectableElement(this.gps, this.departureList.getElementsByClassName("L10")[0], this.selectDeparture.bind(this, 9)),
        ], this.departureList.getElementsByClassName("Slider")[0], this.departureList.getElementsByClassName("SliderCursor")[0]);
        this.departureSelectables = [this.departureSelectableSliderGroup];
    }
    loadDeparture(_event) {
        if (_event == "ENT_Push") {
            this.gps.currFlightPlanManager.setDepartureProcIndex(this.selectedDeparture);
            this.gps.currFlightPlanManager.setDepartureRunwayIndex(this.selectedRunway);
            this.gps.currFlightPlanManager.setDepartureEnRouteTransitionIndex(this.selectedTransition);
            this.gps.closePopUpElement();
        }
    }
    sequenceLineCallback(_index, _event) {
    }
    activateIcaoSearch(_event) {
        if (_event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.icaoSearchField.StartSearch();
            this.gps.SwitchToInteractionState(3);
            this.selectedDeparture = 0;
            this.selectedTransition = 0;
        }
    }
    activateNameSearch(_event) {
        if (_event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            this.gps.currentSearchFieldWaypoint = this.nameSearchField;
            this.nameSearchField.StartSearch();
            this.gps.SwitchToInteractionState(3);
        }
    }
    openDepartureList(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            let strings = [];
            if (infos && infos.icao) {
                for (let i = 0; i < infos.departures.length; i++) {
                    strings.push(infos.departures[i].name);
                }
                this.departureSelectableSliderGroup.setStringElements(strings);
            }
            if (strings.length > 0) {
                this.departureList.setAttribute("state", "Active");
                this.gps.ActiveSelection(this.departureSelectables);
            }
        }
    }
    selectDeparture(_id, _event) {
        if (_event == "ENT_Push") {
            this.departureList.setAttribute("state", "Inactive");
            this.selectedDeparture = _id + this.departureSelectableSliderGroup.getOffset();
            this.gps.SwitchToInteractionState(0);
            this.selectedTransition = 0;
            this.selectedRunway = 0;
        }
    }
    openTransitionList(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            let nbElems = 0;
            this.transitionSelectables = [];
            if (infos && infos.icao && infos.departures.length > this.selectedDeparture && infos.departures[this.selectedDeparture].enRouteTransitions.length > 0) {
                for (let i = 0; i < infos.departures[this.selectedDeparture].enRouteTransitions.length; i++) {
                    if (i >= this.transitionLines.length) {
                        this.transitionLines.push(document.createElement("div"));
                        this.transitionList.appendChild(this.transitionLines[i]);
                    }
                    Avionics.Utils.diffAndSet(this.transitionLines[i], infos.departures[this.selectedDeparture].enRouteTransitions[i].name);
                    Avionics.Utils.diffAndSetAttribute(this.transitionLines[i], "state", "Active");
                    Avionics.Utils.diffAndSetAttribute(this.transitionLines[i], "class", "Blinking");
                    this.transitionSelectables.push(new SelectableElement(this.gps, this.transitionLines[i], this.selectTransition.bind(this, i)));
                }
                nbElems = infos.departures[this.selectedDeparture].enRouteTransitions.length;
            }
            for (let i = nbElems; i < this.transitionLines.length; i++) {
                Avionics.Utils.diffAndSetAttribute(this.transitionLines[i], "state", "Inactive");
            }
            if (this.transitionSelectables.length > 0) {
                this.transitionList.setAttribute("state", "Active");
                this.gps.ActiveSelection(this.transitionSelectables);
            }
        }
    }
    selectTransition(_id, _event) {
        if (_event == "ENT_Push") {
            this.transitionList.setAttribute("state", "Inactive");
            this.selectedTransition = _id;
            this.gps.SwitchToInteractionState(0);
        }
    }
    openRunwaysList(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            let nbElems = 0;
            this.runwaySelectables = [];
            if (infos && infos.icao && infos.departures.length > this.selectedDeparture && infos.departures[this.selectedDeparture].runwayTransitions.length > 0) {
                for (let i = 0; i < infos.departures[this.selectedDeparture].runwayTransitions.length; i++) {
                    if (i >= this.runwayLines.length) {
                        this.runwayLines.push(document.createElement("div"));
                        this.runwayList.appendChild(this.runwayLines[i]);
                    }
                    Avionics.Utils.diffAndSet(this.runwayLines[i], infos.departures[this.selectedDeparture].runwayTransitions[i].name);
                    Avionics.Utils.diffAndSetAttribute(this.runwayLines[i], "state", "Active");
                    Avionics.Utils.diffAndSetAttribute(this.runwayLines[i], "class", "Blinking");
                    this.runwaySelectables.push(new SelectableElement(this.gps, this.runwayLines[i], this.selectRunway.bind(this, i)));
                }
                nbElems = infos.departures[this.selectedDeparture].runwayTransitions.length;
            }
            for (let i = nbElems; i < this.runwayLines.length; i++) {
                Avionics.Utils.diffAndSetAttribute(this.runwayLines[i], "state", "Inactive");
            }
            if (this.runwaySelectables.length > 0) {
                this.runwayList.setAttribute("state", "Active");
                this.gps.ActiveSelection(this.runwaySelectables);
            }
        }
    }
    selectRunway(_id, _event) {
        if (_event == "ENT_Push") {
            this.runwayList.setAttribute("state", "Inactive");
            this.selectedRunway = _id;
            this.gps.SwitchToInteractionState(0);
        }
    }
    onEnter() {
        this.root.setAttribute("state", "Active");
        this.gps.ActiveSelection(this.defaultSelectables);
        let dest = this.gps.currFlightPlanManager.getOrigin();
        if (dest) {
            this.icaoSearchField.SetWaypoint("A", dest.icao);
            let index = this.gps.currFlightPlanManager.getDepartureProcIndex();
            if (index >= 0) {
                this.selectedDeparture = index;
                this.gps.cursorIndex = 1;
            }
        }
    }
    onUpdate(_deltaTime) {
        if (this.elem_airportName) {
            this.nameSearchField.Update();
        }
        this.icaoSearchField.Update();
        if (this.elem_sequence && this.nbLines > 0) {
            this.sequenceSliderGroup.updateDisplay();
        }
        let infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao) {
            Avionics.Utils.diffAndSet(this.elem_airportCity, infos.city);
            switch (infos.privateType) {
                case 0:
                    Avionics.Utils.diffAndSet(this.elem_airportType, "Unknown");
                    break;
                case 1:
                    Avionics.Utils.diffAndSet(this.elem_airportType, "Public");
                    break;
                case 2:
                    Avionics.Utils.diffAndSet(this.elem_airportType, "Military");
                    break;
                case 3:
                    Avionics.Utils.diffAndSet(this.elem_airportType, "Private");
                    break;
            }
            var logo = infos.imageFileName();
            if (logo != "") {
                Avionics.Utils.diffAndSetAttribute(this.elem_airportLogo, "src", "/Pages/VCockpit/Instruments/Shared/Map/Images/" + logo);
            }
            else {
                Avionics.Utils.diffAndSetAttribute(this.elem_airportLogo, "src", "");
            }
            if (infos.departures.length > this.selectedDeparture) {
                Avionics.Utils.diffAndSet(this.elem_departure, infos.departures[this.selectedDeparture].name);
                if (infos.departures[this.selectedDeparture].enRouteTransitions.length > this.selectedTransition) {
                    Avionics.Utils.diffAndSet(this.elem_transition, infos.departures[this.selectedDeparture].enRouteTransitions[this.selectedTransition].name);
                }
                else {
                    Avionics.Utils.diffAndSet(this.elem_transition, "NONE");
                }
                if (infos.departures[this.selectedDeparture].runwayTransitions.length > this.selectedRunway) {
                    Avionics.Utils.diffAndSet(this.elem_runway, infos.departures[this.selectedDeparture].runwayTransitions[this.selectedRunway].name);
                }
                else {
                    Avionics.Utils.diffAndSet(this.elem_runway, "ALL");
                }
            }
            else {
                Avionics.Utils.diffAndSet(this.elem_departure, "NONE");
                Avionics.Utils.diffAndSet(this.elem_transition, "NONE");
            }
            if (this.elem_sequence && this.nbLines > 0) {
                let sequence = [];
                if (infos.departures.length > this.selectedDeparture) {
                    if (infos.departures[this.selectedDeparture].enRouteTransitions.length > this.selectedTransition) {
                        for (let i = 0; i < infos.departures[this.selectedDeparture].enRouteTransitions[this.selectedTransition].legs.length; i++) {
                            sequence.push('<td class="Blinking">' + infos.departures[this.selectedDeparture].enRouteTransitions[this.selectedTransition].legs[i].fixIcao.substr(7, 5) + "</td><td>"
                                + " " + "</td><td>"
                                + " " + "</td><td>"
                                + infos.departures[this.selectedDeparture].enRouteTransitions[this.selectedTransition].legs[i].course.toFixed(0) + "°" + "</td><td>"
                                + infos.departures[this.selectedDeparture].enRouteTransitions[this.selectedTransition].legs[i].distance.toFixed(1) + "NM" + "</td>");
                        }
                    }
                    for (let i = 0; i < infos.departures[this.selectedDeparture].commonLegs.length; i++) {
                        sequence.push('<td class="Blinking">' + infos.departures[this.selectedDeparture].commonLegs[i].fixIcao.substr(7, 5) + "</td><td>"
                            + " " + "</td><td>"
                            + " " + "</td><td>"
                            + infos.departures[this.selectedDeparture].commonLegs[i].course.toFixed(0) + "°" + "</td><td>"
                            + infos.departures[this.selectedDeparture].commonLegs[i].distance.toFixed(1) + "NM" + "</td>");
                    }
                    if (infos.departures[this.selectedDeparture].runwayTransitions.length > this.selectedRunway) {
                        for (let i = 0; i < infos.departures[this.selectedDeparture].runwayTransitions[this.selectedRunway].legs.length; i++) {
                            sequence.push('<td class="Blinking">' + infos.departures[this.selectedDeparture].runwayTransitions[this.selectedRunway].legs[i].fixIcao.substr(7, 5) + "</td><td>"
                                + " " + "</td><td>"
                                + " " + "</td><td>"
                                + infos.departures[this.selectedDeparture].runwayTransitions[this.selectedRunway].legs[i].course.toFixed(0) + "°" + "</td><td>"
                                + infos.departures[this.selectedDeparture].runwayTransitions[this.selectedRunway].legs[i].distance.toFixed(1) + "NM" + "</td>");
                        }
                    }
                    this.sequenceSliderGroup.setStringElements(sequence);
                }
                else {
                    this.sequenceSliderGroup.setStringElements([]);
                }
            }
        }
        else {
            Avionics.Utils.diffAndSet(this.elem_airportCity, "____________");
            Avionics.Utils.diffAndSet(this.elem_airportType, "Unknown");
            Avionics.Utils.diffAndSetAttribute(this.elem_airportLogo, "src", "");
            if (this.elem_sequence && this.nbLines > 0) {
                this.sequenceSliderGroup.setStringElements([]);
            }
        }
    }
    onExit() {
        this.root.setAttribute("state", "Inactive");
        this.gps.currFlightPlanManager.updateFlightPlan(() => {
            this.gps.currFlightPlanManager.updateCurrentApproach();
        });
        this.gps.SwitchToInteractionState(0);
    }
    onEvent(_event) {
        if (_event == "NavigationPush") {
            this.departureList.setAttribute("state", "Inactive");
            this.transitionList.setAttribute("state", "Inactive");
            this.runwayList.setAttribute("state", "Inactive");
        }
    }
}
//# sourceMappingURL=CommonPFD_MFD.js.map