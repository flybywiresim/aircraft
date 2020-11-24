class RangeDisplay {
    constructor(_type = "RangeDisplay") {
        this.min = 0;
        this.max = 0;
        this.lowLimit = 0;
        this.highLimit = 0;
        this.__Type = _type;
    }
}
class ColorRangeDisplay extends RangeDisplay {
    constructor(_type = "ColorRangeDisplay") {
        super(_type);
        this.greenStart = 0;
        this.greenEnd = 0;
    }
}
class ColorRangeDisplay2 extends ColorRangeDisplay {
    constructor(_type = "ColorRangeDisplay2") {
        super(_type);
        this.yellowStart = 0;
        this.yellowEnd = 0;
        this.redStart = 0;
        this.redEnd = 0;
    }
}
class ColorRangeDisplay3 extends ColorRangeDisplay2 {
    constructor(_type = "ColorRangeDisplay3") {
        super(_type);
        this.lowRedStart = 0;
        this.lowRedEnd = 0;
        this.lowYellowStart = 0;
        this.lowYellowEnd = 0;
    }
}
class ColorRangeDisplay4 extends ColorRangeDisplay2 {
    constructor(_type = "ColorRangeDisplay4") {
        super(_type);
        this.whiteStart = 0;
        this.whiteEnd = 0;
    }
}
class FlapsRangeDisplay extends RangeDisplay {
    constructor(_type = "FlapsRangeDisplay") {
        super(_type);
        this.takeOffValue = 0;
    }
}
class ThrottleLevelsInfo {
    constructor() {
        this.__Type = "ThrottleLevelsInfo";
        this.minValues = [0, 0, 0, 0, 0];
        this.names = ["", "", "", "", ""];
    }
}
class FlapsLevelsInfo {
    constructor() {
        this.__Type = "FlapsLevelsInfo";
        this.slatsAngle = [0, 0, 0, 0];
        this.flapsAngle = [0, 0, 0, 0];
    }
}
class GlassCockpitSettings {
    constructor() {
        this.FuelFlow = new ColorRangeDisplay();
        this.FuelQuantity = new ColorRangeDisplay2();
        this.FuelTemperature = new ColorRangeDisplay3();
        this.FuelPressure = new ColorRangeDisplay3();
        this.OilPressure = new ColorRangeDisplay3();
        this.OilTemperature = new ColorRangeDisplay3();
        this.EGTTemperature = new RangeDisplay();
        this.Vacuum = new ColorRangeDisplay();
        this.ManifoldPressure = new ColorRangeDisplay();
        this.AirSpeed = new ColorRangeDisplay4();
        this.Torque = new ColorRangeDisplay2();
        this.RPM = new ColorRangeDisplay2();
        this.TurbineNg = new ColorRangeDisplay2();
        this.ITTEngineOff = new ColorRangeDisplay3();
        this.ITTEngineOn = new ColorRangeDisplay3();
        this.MainBusVoltage = new ColorRangeDisplay3();
        this.HotBatteryBusVoltage = new ColorRangeDisplay3();
        this.BatteryBusAmps = new ColorRangeDisplay2();
        this.GenAltBusAmps = new ColorRangeDisplay2();
        this.CoolantLevel = new RangeDisplay();
        this.CoolantTemperature = new ColorRangeDisplay3();
        this.GearOilTemperature = new ColorRangeDisplay2();
        this.CabinAltitude = new ColorRangeDisplay();
        this.CabinAltitudeChangeRate = new RangeDisplay();
        this.CabinPressureDiff = new ColorRangeDisplay();
        this.ThrottleLevels = new ThrottleLevelsInfo();
        this.FlapsLevels = new FlapsLevelsInfo();
    }
}
class FuelLevels {
    constructor() {
        this.fuel_tank_selector = new Array();
    }
}
class DesignSpeeds {
}
var EngineType;
(function (EngineType) {
    EngineType[EngineType["ENGINE_TYPE_PISTON"] = 0] = "ENGINE_TYPE_PISTON";
    EngineType[EngineType["ENGINE_TYPE_JET"] = 1] = "ENGINE_TYPE_JET";
    EngineType[EngineType["ENGINE_TYPE_NONE"] = 2] = "ENGINE_TYPE_NONE";
    EngineType[EngineType["ENGINE_TYPE_HELO_TURBINE"] = 3] = "ENGINE_TYPE_HELO_TURBINE";
    EngineType[EngineType["ENGINE_TYPE_ROCKET"] = 4] = "ENGINE_TYPE_ROCKET";
    EngineType[EngineType["ENGINE_TYPE_TURBOPROP"] = 5] = "ENGINE_TYPE_TURBOPROP";
})(EngineType || (EngineType = {}));
var PropellerType;
(function (PropellerType) {
    PropellerType[PropellerType["PROPELLER_TYPE_CONSTANT_SPEED"] = 0] = "PROPELLER_TYPE_CONSTANT_SPEED";
    PropellerType[PropellerType["PROPELLER_TYPE_FIXED_PITCH"] = 1] = "PROPELLER_TYPE_FIXED_PITCH";
})(PropellerType || (PropellerType = {}));
var Aircraft;
(function (Aircraft) {
    Aircraft[Aircraft["CJ4"] = 0] = "CJ4";
    Aircraft[Aircraft["A320_NEO"] = 1] = "A320_NEO";
    Aircraft[Aircraft["B747_8"] = 2] = "B747_8";
    Aircraft[Aircraft["AS01B"] = 3] = "AS01B";
    Aircraft[Aircraft["AS02A"] = 4] = "AS02A";
})(Aircraft || (Aircraft = {}));
var ThrottleMode;
(function (ThrottleMode) {
    ThrottleMode[ThrottleMode["UNKNOWN"] = 0] = "UNKNOWN";
    ThrottleMode[ThrottleMode["REVERSE"] = 1] = "REVERSE";
    ThrottleMode[ThrottleMode["IDLE"] = 2] = "IDLE";
    ThrottleMode[ThrottleMode["AUTO"] = 3] = "AUTO";
    ThrottleMode[ThrottleMode["CLIMB"] = 4] = "CLIMB";
    ThrottleMode[ThrottleMode["FLEX_MCT"] = 5] = "FLEX_MCT";
    ThrottleMode[ThrottleMode["TOGA"] = 6] = "TOGA";
    ThrottleMode[ThrottleMode["HOLD"] = 7] = "HOLD";
})(ThrottleMode || (ThrottleMode = {}));
var AutopilotMode;
(function (AutopilotMode) {
    AutopilotMode[AutopilotMode["MANAGED"] = 0] = "MANAGED";
    AutopilotMode[AutopilotMode["SELECTED"] = 1] = "SELECTED";
    AutopilotMode[AutopilotMode["HOLD"] = 2] = "HOLD";
})(AutopilotMode || (AutopilotMode = {}));
var FlightState;
(function (FlightState) {
    FlightState[FlightState["FLIGHT_STATE_BRIEFING"] = 0] = "FLIGHT_STATE_BRIEFING";
    FlightState[FlightState["FLIGHT_STATE_INTRO_PLANE"] = 1] = "FLIGHT_STATE_INTRO_PLANE";
    FlightState[FlightState["FLIGHT_STATE_INTRO"] = 2] = "FLIGHT_STATE_INTRO";
    FlightState[FlightState["FLIGHT_STATE_PREFLIGHT_GATE"] = 3] = "FLIGHT_STATE_PREFLIGHT_GATE";
    FlightState[FlightState["FLIGHT_STATE_PREFLIGHT_PUSHBACK"] = 4] = "FLIGHT_STATE_PREFLIGHT_PUSHBACK";
    FlightState[FlightState["FLIGHT_STATE_PREFLIGHT_TAXI"] = 5] = "FLIGHT_STATE_PREFLIGHT_TAXI";
    FlightState[FlightState["FLIGHT_STATE_PREFLIGHT_HOLDSHORT"] = 6] = "FLIGHT_STATE_PREFLIGHT_HOLDSHORT";
    FlightState[FlightState["FLIGHT_STATE_FLIGHT_RUNWAY"] = 7] = "FLIGHT_STATE_FLIGHT_RUNWAY";
    FlightState[FlightState["FLIGHT_STATE_FLIGHT_INITIAL_CLIMB"] = 8] = "FLIGHT_STATE_FLIGHT_INITIAL_CLIMB";
    FlightState[FlightState["FLIGHT_STATE_FLIGHT_CLIMB"] = 9] = "FLIGHT_STATE_FLIGHT_CLIMB";
    FlightState[FlightState["FLIGHT_STATE_FLIGHT_CRUISE"] = 10] = "FLIGHT_STATE_FLIGHT_CRUISE";
    FlightState[FlightState["FLIGHT_STATE_FLIGHT_DESCENT"] = 11] = "FLIGHT_STATE_FLIGHT_DESCENT";
    FlightState[FlightState["FLIGHT_STATE_JOINPLANE"] = 12] = "FLIGHT_STATE_JOINPLANE";
    FlightState[FlightState["FLIGHT_STATE_LANDING_APPROACH"] = 13] = "FLIGHT_STATE_LANDING_APPROACH";
    FlightState[FlightState["FLIGHT_STATE_LANDING_FINAL"] = 14] = "FLIGHT_STATE_LANDING_FINAL";
    FlightState[FlightState["FLIGHT_STATE_LANDING_TOUCHDOWN"] = 15] = "FLIGHT_STATE_LANDING_TOUCHDOWN";
    FlightState[FlightState["FLIGHT_STATE_LANDING_GROUNDROLL"] = 16] = "FLIGHT_STATE_LANDING_GROUNDROLL";
    FlightState[FlightState["FLIGHT_STATE_LANDING_TAXI"] = 17] = "FLIGHT_STATE_LANDING_TAXI";
    FlightState[FlightState["FLIGHT_STATE_LANDING_GATE"] = 18] = "FLIGHT_STATE_LANDING_GATE";
    FlightState[FlightState["FLIGHT_STATE_LANDING_REST"] = 19] = "FLIGHT_STATE_LANDING_REST";
    FlightState[FlightState["FLIGHT_STATE_OUTRO"] = 20] = "FLIGHT_STATE_OUTRO";
    FlightState[FlightState["FLIGHT_STATE_WAITING"] = 21] = "FLIGHT_STATE_WAITING";
    FlightState[FlightState["FLIGHT_STATE_TELEPORTTOSTATE"] = 22] = "FLIGHT_STATE_TELEPORTTOSTATE";
    FlightState[FlightState["FLIGHT_STATE_FREEFLIGHT"] = 23] = "FLIGHT_STATE_FREEFLIGHT";
    FlightState[FlightState["FLIGHT_STATE_LANDINGCHALLENGE"] = 24] = "FLIGHT_STATE_LANDINGCHALLENGE";
    FlightState[FlightState["FLIGHT_STATE_BUSHTRIP"] = 25] = "FLIGHT_STATE_BUSHTRIP";
})(FlightState || (FlightState = {}));
var FlightPhase;
(function (FlightPhase) {
    FlightPhase[FlightPhase["FLIGHT_PHASE_PREFLIGHT"] = 0] = "FLIGHT_PHASE_PREFLIGHT";
    FlightPhase[FlightPhase["FLIGHT_PHASE_TAXI"] = 1] = "FLIGHT_PHASE_TAXI";
    FlightPhase[FlightPhase["FLIGHT_PHASE_TAKEOFF"] = 2] = "FLIGHT_PHASE_TAKEOFF";
    FlightPhase[FlightPhase["FLIGHT_PHASE_CLIMB"] = 3] = "FLIGHT_PHASE_CLIMB";
    FlightPhase[FlightPhase["FLIGHT_PHASE_CRUISE"] = 4] = "FLIGHT_PHASE_CRUISE";
    FlightPhase[FlightPhase["FLIGHT_PHASE_DESCENT"] = 5] = "FLIGHT_PHASE_DESCENT";
    FlightPhase[FlightPhase["FLIGHT_PHASE_APPROACH"] = 6] = "FLIGHT_PHASE_APPROACH";
    FlightPhase[FlightPhase["FLIGHT_PHASE_GOAROUND"] = 7] = "FLIGHT_PHASE_GOAROUND";
})(FlightPhase || (FlightPhase = {}));
var ApproachType;
(function (ApproachType) {
    ApproachType[ApproachType["APPROACH_TYPE_UNKNOWN"] = 0] = "APPROACH_TYPE_UNKNOWN";
    ApproachType[ApproachType["APPROACH_TYPE_VFR"] = 1] = "APPROACH_TYPE_VFR";
    ApproachType[ApproachType["APPROACH_TYPE_HEL"] = 2] = "APPROACH_TYPE_HEL";
    ApproachType[ApproachType["APPROACH_TYPE_TACAN"] = 3] = "APPROACH_TYPE_TACAN";
    ApproachType[ApproachType["APPROACH_TYPE_NDB"] = 4] = "APPROACH_TYPE_NDB";
    ApproachType[ApproachType["APPROACH_TYPE_LORAN"] = 5] = "APPROACH_TYPE_LORAN";
    ApproachType[ApproachType["APPROACH_TYPE_RNAV"] = 6] = "APPROACH_TYPE_RNAV";
    ApproachType[ApproachType["APPROACH_TYPE_VOR"] = 7] = "APPROACH_TYPE_VOR";
    ApproachType[ApproachType["APPROACH_TYPE_GPS"] = 8] = "APPROACH_TYPE_GPS";
    ApproachType[ApproachType["APPROACH_TYPE_SDF"] = 9] = "APPROACH_TYPE_SDF";
    ApproachType[ApproachType["APPROACH_TYPE_LDA"] = 10] = "APPROACH_TYPE_LDA";
    ApproachType[ApproachType["APPROACH_TYPE_LOC"] = 11] = "APPROACH_TYPE_LOC";
    ApproachType[ApproachType["APPROACH_TYPE_MLS"] = 12] = "APPROACH_TYPE_MLS";
    ApproachType[ApproachType["APPROACH_TYPE_ILS"] = 13] = "APPROACH_TYPE_ILS";
})(ApproachType || (ApproachType = {}));
var WorldRegion;
(function (WorldRegion) {
    WorldRegion[WorldRegion["NORTH_AMERICA"] = 0] = "NORTH_AMERICA";
    WorldRegion[WorldRegion["AUSTRALIA"] = 1] = "AUSTRALIA";
    WorldRegion[WorldRegion["OTHER"] = 2] = "OTHER";
})(WorldRegion || (WorldRegion = {}));
var NAV_AID_STATE;
(function (NAV_AID_STATE) {
    NAV_AID_STATE[NAV_AID_STATE["OFF"] = 0] = "OFF";
    NAV_AID_STATE[NAV_AID_STATE["ADF"] = 1] = "ADF";
    NAV_AID_STATE[NAV_AID_STATE["VOR"] = 2] = "VOR";
})(NAV_AID_STATE || (NAV_AID_STATE = {}));
var NAV_AID_MODE;
(function (NAV_AID_MODE) {
    NAV_AID_MODE[NAV_AID_MODE["NONE"] = 0] = "NONE";
    NAV_AID_MODE[NAV_AID_MODE["MANUAL"] = 1] = "MANUAL";
    NAV_AID_MODE[NAV_AID_MODE["REMOTE"] = 2] = "REMOTE";
})(NAV_AID_MODE || (NAV_AID_MODE = {}));
var Simplane;
(function (Simplane) {
    function getDesignSpeeds() {
        var speeds = new DesignSpeeds();
        speeds.VS0 = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VS0", "knots");
        speeds.VS1 = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VS1", "knots");
        speeds.VFe = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VFE", "knots");
        speeds.VNe = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VNE", "knots");
        speeds.VNo = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VNO", "knots");
        speeds.VMin = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VMIN", "knots");
        speeds.VMax = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VMAX", "knots");
        speeds.Vr = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VR", "knots");
        speeds.Vx = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VX", "knots");
        speeds.Vy = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VY", "knots");
        speeds.Vapp = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VAPP", "knots");
        speeds.BestGlide = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED BEST GLIDE", "knots");
        return speeds;
    }
    Simplane.getDesignSpeeds = getDesignSpeeds;
    function getTrueSpeed() {
        var speed = SimVar.GetSimVarValue("AIRSPEED TRUE", "knots");
        return Math.max(0, speed);
    }
    Simplane.getTrueSpeed = getTrueSpeed;
    function getIndicatedSpeed() {
        var speed = SimVar.GetSimVarValue("AIRSPEED INDICATED", "knots");
        return Math.max(0, speed);
    }
    Simplane.getIndicatedSpeed = getIndicatedSpeed;
    function getVerticalSpeed() {
        var speed = SimVar.GetSimVarValue("VERTICAL SPEED", "feet per minute");
        return speed;
    }
    Simplane.getVerticalSpeed = getVerticalSpeed;
    function getGroundSpeed() {
        var speed = SimVar.GetSimVarValue("GPS GROUND SPEED", "Knots");
        return speed;
    }
    Simplane.getGroundSpeed = getGroundSpeed;
    function getMachSpeed() {
        var speed = SimVar.GetSimVarValue("AIRSPEED MACH", "mach");
        return speed;
    }
    Simplane.getMachSpeed = getMachSpeed;
    function getV1Airspeed() {
        const phase = getCurrentFlightPhase();
        if (phase <= FlightPhase.FLIGHT_PHASE_TAKEOFF) {
            return SimVar.GetSimVarValue("L:AIRLINER_V1_SPEED", "Knots");
        }
        return -1;
    }
    Simplane.getV1Airspeed = getV1Airspeed;
    function getVRAirspeed() {
        const phase = getCurrentFlightPhase();
        if (phase <= FlightPhase.FLIGHT_PHASE_TAKEOFF) {
            return SimVar.GetSimVarValue("L:AIRLINER_VR_SPEED", "Knots");
        }
        return -1;
    }
    Simplane.getVRAirspeed = getVRAirspeed;
    function getV2Airspeed() {
        const phase = getCurrentFlightPhase();
        if (phase <= FlightPhase.FLIGHT_PHASE_TAKEOFF) {
            return SimVar.GetSimVarValue("L:AIRLINER_V2_SPEED", "Knots");
        }
        return -1;
    }
    Simplane.getV2Airspeed = getV2Airspeed;
    function getREFAirspeed() {
        return SimVar.GetSimVarValue("L:AIRLINER_VREF_SPEED", "Knots");
    }
    Simplane.getREFAirspeed = getREFAirspeed;
    function getVXAirspeed() {
        return SimVar.GetSimVarValue("L:AIRLINER_VX_SPEED", "Knots");
    }
    Simplane.getVXAirspeed = getVXAirspeed;
    function getFMCGreenDotSpeed() {
        return SimVar.GetSimVarValue("L:AIRLINER_TO_GREEN_DOT_SPD", "Number");
    }
    Simplane.getFMCGreenDotSpeed = getFMCGreenDotSpeed;
    function getFMCApprGreenDotSpeed() {
        return SimVar.GetSimVarValue("L:AIRLINER_APPR_GREEN_DOT_SPD", "Number");
    }
    Simplane.getFMCApprGreenDotSpeed = getFMCApprGreenDotSpeed;
    function getGreenDotSpeed() {
        return SimVar.GetGameVarValue("AIRCRAFT GREEN DOT SPEED", "Knots");
    }
    Simplane.getGreenDotSpeed = getGreenDotSpeed;
    function getCrossoverSpeedFactor(_cas, _mach) {
        if (_mach > 0) {
            return SimVar.GetGameVarValue("AIRCRAFT CROSSOVER SPEED FACTOR", "Number", _cas, _mach);
        }
        return 1.0;
    }
    Simplane.getCrossoverSpeedFactor = getCrossoverSpeedFactor;
    function getFlapsLimitSpeed(_aircraft, _flapIndex) {
        let maxSpeed = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VNO", "knots");
        if (_flapIndex > 0) {
            const limit = SimVar.GetGameVarValue("AIRCRAFT FLAPS SPEED LIMIT", "Knots", _flapIndex);
            if (limit > 0) {
                maxSpeed = limit;
            }
        }
        return maxSpeed;
    }
    Simplane.getFlapsLimitSpeed = getFlapsLimitSpeed;
    var _simplaneFlapHandleIndex;
    var _simplaneFlapHandleIndexTimeLastCall = 0;
    function getFlapsHandleIndex(forceSimVarCall = false) {
        let doSimVarCall = false;
        let t = 0;
        if (forceSimVarCall || _simplaneFlapHandleIndex === undefined) {
            doSimVarCall = true;
        } else {
            t = performance.now();
            if (t - _simplaneFlapHandleIndexTimeLastCall > 1000) {
                doSimVarCall = true;
            }
        }
        if (doSimVarCall) {
            _simplaneFlapHandleIndex = SimVar.GetSimVarValue("FLAPS HANDLE INDEX", "Number");
            _simplaneFlapHandleIndexTimeLastCall = t;
        }
        return _simplaneFlapHandleIndex;
    }
    Simplane.getFlapsHandleIndex = getFlapsHandleIndex;
    function getFlapsExtendSpeed(_aircraft, forceSimVarCall = false) {
        const flapsHandleIndex = Simplane.getFlapsHandleIndex(forceSimVarCall);
        return getFlapsLimitSpeed(_aircraft, flapsHandleIndex);
    }
    Simplane.getFlapsExtendSpeed = getFlapsExtendSpeed;
    function getNextFlapsExtendSpeed(_aircraft, forceSimVarCall = false) {
        const flapsHandleIndex = Simplane.getFlapsHandleIndex(forceSimVarCall) + 1;
        return getFlapsLimitSpeed(_aircraft, flapsHandleIndex);
    }
    Simplane.getNextFlapsExtendSpeed = getNextFlapsExtendSpeed;
    function getMaxSpeed(_aircraft) {
        let maxSpeed = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VNO", "knots");
        maxSpeed = Math.min(maxSpeed, getFlapsExtendSpeed(_aircraft));
        if (SimVar.GetSimVarValue("GEAR POSITION", "Number") > Number.EPSILON) {
            const gearSpeed = SimVar.GetGameVarValue("AIRCRAFT MAX GEAR EXTENDED", "knots");
            maxSpeed = Math.min(maxSpeed, gearSpeed);
        }
        return maxSpeed;
    }
    Simplane.getMaxSpeed = getMaxSpeed;
    function getLowestSelectableSpeed() {
        return SimVar.GetGameVarValue("AIRCRAFT LOWEST SELECTABLE SPEED", "knots");
    }
    Simplane.getLowestSelectableSpeed = getLowestSelectableSpeed;
    function getStallProtectionMinSpeed() {
        return SimVar.GetGameVarValue("AIRCRAFT STALL PROTECTION SPEED MIN", "knots");
    }
    Simplane.getStallProtectionMinSpeed = getStallProtectionMinSpeed;
    function getStallProtectionMaxSpeed() {
        return SimVar.GetGameVarValue("AIRCRAFT STALL PROTECTION SPEED MAX", "knots");
    }
    Simplane.getStallProtectionMaxSpeed = getStallProtectionMaxSpeed;
    function getStallSpeed() {
        return SimVar.GetGameVarValue("AIRCRAFT STALL SPEED", "knots");
    }
    Simplane.getStallSpeed = getStallSpeed;
    function getStallSpeedPredicted(_flapIndex) {
        return SimVar.GetGameVarValue("AIRCRAFT STALL SPEED PREDICTED", "knots", _flapIndex);
    }
    Simplane.getStallSpeedPredicted = getStallSpeedPredicted;
    function getWindDirection() {
        var angle = SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "Degrees");
        return angle;
    }
    Simplane.getWindDirection = getWindDirection;
    function getWindStrength() {
        var strength = SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "Knots");
        return strength;
    }
    Simplane.getWindStrength = getWindStrength;
    function getAutoPilotActive(_apIndex = 0) {
        if (_apIndex == 0) {
            return SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool");
        } else {
            return SimVar.GetSimVarValue("L:XMLVAR_Autopilot_" + _apIndex + "_Status", "Bool");
        }
    }
    Simplane.getAutoPilotActive = getAutoPilotActive;
    function getAutoPilotAirspeedManaged() {
        return SimVar.GetSimVarValue("AUTOPILOT SPEED SLOT INDEX", "number") === 2;
    }
    Simplane.getAutoPilotAirspeedManaged = getAutoPilotAirspeedManaged;
    function getAutoPilotAirspeedSelected() {
        return SimVar.GetSimVarValue("AUTOPILOT SPEED SLOT INDEX", "number") === 1;
    }
    Simplane.getAutoPilotAirspeedSelected = getAutoPilotAirspeedSelected;
    function getAutoPilotAirspeedHoldActive(isManaged = false) {
        return SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD:" + (isManaged ? "2" : "1"), "Bool");
    }
    Simplane.getAutoPilotAirspeedHoldActive = getAutoPilotAirspeedHoldActive;
    function getAutoPilotAirspeedHoldValue() {
        var speed = SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD VAR", "knots");
        return speed;
    }
    Simplane.getAutoPilotAirspeedHoldValue = getAutoPilotAirspeedHoldValue;
    function getAutoPilotSelectedAirspeedHoldValue() {
        var speed = SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD VAR:1", "knots");
        return speed;
    }
    Simplane.getAutoPilotSelectedAirspeedHoldValue = getAutoPilotSelectedAirspeedHoldValue;
    function getAutoPilotManagedAirspeedHoldValue() {
        var speed = SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD VAR:2", "knots");
        return speed;
    }
    Simplane.getAutoPilotManagedAirspeedHoldValue = getAutoPilotManagedAirspeedHoldValue;
    function getAutoPilotMachModeActive() {
        return SimVar.GetSimVarValue("L:XMLVAR_AirSpeedIsInMach", "bool") || SimVar.GetSimVarValue("AUTOPILOT MANAGED SPEED IN MACH", "bool");
    }
    Simplane.getAutoPilotMachModeActive = getAutoPilotMachModeActive;
    function getAutoPilotMachHoldValue() {
        var speed = SimVar.GetSimVarValue("AUTOPILOT MACH HOLD VAR", "number");
        return speed;
    }
    Simplane.getAutoPilotMachHoldValue = getAutoPilotMachHoldValue;
    function getAutoPilotSelectedMachHoldValue() {
        var speed = SimVar.GetSimVarValue("AUTOPILOT MACH HOLD VAR:1", "number");
        return speed;
    }
    Simplane.getAutoPilotSelectedMachHoldValue = getAutoPilotSelectedMachHoldValue;
    function getAutoPilotManagedMachHoldValue() {
        var speed = SimVar.GetSimVarValue("AUTOPILOT MACH HOLD VAR:2", "number");
        return speed;
    }
    Simplane.getAutoPilotManagedMachHoldValue = getAutoPilotManagedMachHoldValue;
    function getAutoPilotHeadingManaged() {
        return SimVar.GetSimVarValue("AUTOPILOT HEADING SLOT INDEX", "number") === 2;
    }
    Simplane.getAutoPilotHeadingManaged = getAutoPilotHeadingManaged;
    function getAutoPilotHeadingSelected() {
        return SimVar.GetSimVarValue("AUTOPILOT HEADING SLOT INDEX", "number") === 1;
    }
    Simplane.getAutoPilotHeadingSelected = getAutoPilotHeadingSelected;
    function getAutoPilotHeadingLockActive() {
        return SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Bool");
    }
    Simplane.getAutoPilotHeadingLockActive = getAutoPilotHeadingLockActive;
    function getAutoPilotHeadingLockValue(_radians = true) {
        if (_radians) {
            return SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR", "radians");
        } else {
            return SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR", "degrees");
        }
    }
    Simplane.getAutoPilotHeadingLockValue = getAutoPilotHeadingLockValue;
    function getAutoPilotSelectedHeadingLockValue(_radians = true) {
        if (_radians) {
            return SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR:1", "radians");
        } else {
            return SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR:1", "degrees");
        }
    }
    Simplane.getAutoPilotSelectedHeadingLockValue = getAutoPilotSelectedHeadingLockValue;
    function getAutoPilotAltitudeManaged() {
        return SimVar.GetSimVarValue("AUTOPILOT ALTITUDE SLOT INDEX", "number") === 2;
    }
    Simplane.getAutoPilotAltitudeManaged = getAutoPilotAltitudeManaged;
    function getAutoPilotAltitudeSelected() {
        return SimVar.GetSimVarValue("AUTOPILOT ALTITUDE SLOT INDEX", "number") === 1;
    }
    Simplane.getAutoPilotAltitudeSelected = getAutoPilotAltitudeSelected;
    function getAutoPilotAltitudeArmed() {
        if (Simplane.getAutoPilotVerticalSpeedHoldActive()) {
            return true;
        }
        return SimVar.GetSimVarValue("AUTOPILOT ALTITUDE ARM", "Bool");
    }
    Simplane.getAutoPilotAltitudeArmed = getAutoPilotAltitudeArmed;
    function getAutoPilotAltitudeLockActive() {
        return SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Bool");
    }
    Simplane.getAutoPilotAltitudeLockActive = getAutoPilotAltitudeLockActive;
    function getAutoPilotFLCActive() {
        return SimVar.GetSimVarValue("AUTOPILOT FLIGHT LEVEL CHANGE", "Boolean") === 1;
    }
    Simplane.getAutoPilotFLCActive = getAutoPilotFLCActive;
    function getAutoPilotAltitudeLockValue(_units = "feet") {
        var altitude = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", _units);
        return altitude;
    }
    Simplane.getAutoPilotAltitudeLockValue = getAutoPilotAltitudeLockValue;
    function getAutoPilotSelectedAltitudeLockValue(_units = "feet") {
        var altitude = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:1", _units);
        return altitude;
    }
    Simplane.getAutoPilotSelectedAltitudeLockValue = getAutoPilotSelectedAltitudeLockValue;
    function getAutoPilotDisplayedAltitudeLockValue(_units = "feet") {
        var altitude = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:3", _units);
        return altitude;
    }
    Simplane.getAutoPilotDisplayedAltitudeLockValue = getAutoPilotDisplayedAltitudeLockValue;
    function getAutoPilotAltitudeLockUnits() {
        return "feet";
    }
    Simplane.getAutoPilotAltitudeLockUnits = getAutoPilotAltitudeLockUnits;
    function getAutoPilotVerticalSpeedHoldActive() {
        return SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Bool");
    }
    Simplane.getAutoPilotVerticalSpeedHoldActive = getAutoPilotVerticalSpeedHoldActive;
    function getAutoPilotVerticalSpeedHoldValue() {
        var vspeed = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet per minute");
        return vspeed;
    }
    Simplane.getAutoPilotVerticalSpeedHoldValue = getAutoPilotVerticalSpeedHoldValue;
    function getAutoPilotSelectedVerticalSpeedHoldValue() {
        var vspeed = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR:2", "feet per minute");
        return vspeed;
    }
    Simplane.getAutoPilotSelectedVerticalSpeedHoldValue = getAutoPilotSelectedVerticalSpeedHoldValue;
    function getAutoPilotDisplayedVerticalSpeedHoldValue() {
        var vspeed = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR:3", "feet per minute");
        return vspeed;
    }
    Simplane.getAutoPilotDisplayedVerticalSpeedHoldValue = getAutoPilotDisplayedVerticalSpeedHoldValue;
    function getAutoPilotLateralModeActive() {
        return SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "bool");
    }
    Simplane.getAutoPilotLateralModeActive = getAutoPilotLateralModeActive;
    function getAutoPilotFlightDirectorActive(_fdIndex) {
        return SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR ACTIVE:" + _fdIndex, "bool");
    }
    Simplane.getAutoPilotFlightDirectorActive = getAutoPilotFlightDirectorActive;
    function getAutoPilotFlightDirectorBankValue() {
        var angle = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR BANK", "degree");
        return angle;
    }
    Simplane.getAutoPilotFlightDirectorBankValue = getAutoPilotFlightDirectorBankValue;
    function getAutoPilotFlightDirectorPitchValue() {
        var angle = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR PITCH", "degree");
        return angle;
    }
    Simplane.getAutoPilotFlightDirectorPitchValue = getAutoPilotFlightDirectorPitchValue;
    function getAutopilotGPSDriven() {
        return SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool");
    }
    Simplane.getAutopilotGPSDriven = getAutopilotGPSDriven;
    function getAutopilotGPSActive() {
        return SimVar.GetSimVarValue("GPS IS ACTIVE WAY POINT", "Bool");
    }
    Simplane.getAutopilotGPSActive = getAutopilotGPSActive;
    function getAutoPilotTrackAngle() {
        var angle = SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree");
        return angle;
    }
    Simplane.getAutoPilotTrackAngle = getAutoPilotTrackAngle;
    function getAutoPilotFlightPathAngle() {
        var angle = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR PITCH", "degree");
        return angle;
    }
    Simplane.getAutoPilotFlightPathAngle = getAutoPilotFlightPathAngle;
    function getAutoPilotThrottleArmed(_index = 0) {
        if (_index == 0) {
            return SimVar.GetSimVarValue("AUTOPILOT THROTTLE ARM", "bool");
        } else {
            return SimVar.GetSimVarValue("AUTOPILOT THROTTLE ARM:" + _index, "bool");
        }
    }
    Simplane.getAutoPilotThrottleArmed = getAutoPilotThrottleArmed;
    function getAutoPilotThrottleLocked() {
        return SimVar.GetSimVarValue("FLY BY WIRE ALPHA PROTECTION", "bool");
    }
    Simplane.getAutoPilotThrottleLocked = getAutoPilotThrottleLocked;
    function getAutoPilotThrottleActive(_index = 0) {
        if (_index == 0) {
            return SimVar.GetSimVarValue("AUTOPILOT MANAGED THROTTLE ACTIVE", "bool");
        } else {
            return SimVar.GetSimVarValue("AUTOPILOT MANAGED THROTTLE ACTIVE:" + _index, "bool");
        }
    }
    Simplane.getAutoPilotThrottleActive = getAutoPilotThrottleActive;
    function getAutoPilotTOGAActive() {
        return SimVar.GetSimVarValue("AUTOPILOT TAKEOFF POWER ACTIVE", "bool");
    }
    Simplane.getAutoPilotTOGAActive = getAutoPilotTOGAActive;
    function getAutoPilotAPPRCaptured() {
        return SimVar.GetSimVarValue("AUTOPILOT APPROACH CAPTURED", "bool");
    }
    Simplane.getAutoPilotAPPRCaptured = getAutoPilotAPPRCaptured;
    function getAutoPilotAPPRActive() {
        if (SimVar.GetSimVarValue("AUTOPILOT APPROACH ACTIVE", "bool") && !getAutopilotGPSDriven() && getAutoPilotAPPRCaptured()) {
            return true;
        }
        return false;
    }
    Simplane.getAutoPilotAPPRActive = getAutoPilotAPPRActive;
    function getAutoPilotAPPRArm() {
        if (SimVar.GetSimVarValue("AUTOPILOT APPROACH ARM", "bool")) {
            return true;
        }
        if (SimVar.GetSimVarValue("AUTOPILOT APPROACH ACTIVE", "bool") && (getAutopilotGPSDriven() || !getAutoPilotAPPRCaptured())) {
            return true;
        }
        return false;
    }
    Simplane.getAutoPilotAPPRArm = getAutoPilotAPPRArm;
    function getAutoPilotAPPRHold() {
        return SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "bool");
    }
    Simplane.getAutoPilotAPPRHold = getAutoPilotAPPRHold;
    function getAutoPilotTRKFPAModeActive() {
        return SimVar.GetSimVarValue("L:XMLVAR_TRK_FPA_MODE_ACTIVE", "Boolean");
    }
    Simplane.getAutoPilotTRKFPAModeActive = getAutoPilotTRKFPAModeActive;
    function getAutoPilotTRKModeActive() {
        return SimVar.GetSimVarValue("L:XMLVAR_TRK_MODE_ACTIVE", "Boolean");
    }
    Simplane.getAutoPilotTRKModeActive = getAutoPilotTRKModeActive;
    function getAutoPilotFPAModeActive() {
        return SimVar.GetSimVarValue("L:XMLVAR_FPA_MODE_ACTIVE", "Boolean");
    }
    Simplane.getAutoPilotFPAModeActive = getAutoPilotFPAModeActive;
    function getAutoPilotGlideslopeActive() {
        return SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ACTIVE", "bool");
    }
    Simplane.getAutoPilotGlideslopeActive = getAutoPilotGlideslopeActive;
    function getAutoPilotGlideslopeArm() {
        return SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ARM", "bool");
    }
    Simplane.getAutoPilotGlideslopeArm = getAutoPilotGlideslopeArm;
    function getAutoPilotGlideslopeHold() {
        return SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE HOLD", "bool");
    }
    Simplane.getAutoPilotGlideslopeHold = getAutoPilotGlideslopeHold;
    function getAutoPilotApproachType() {
        return SimVar.GetSimVarValue("GPS APPROACH APPROACH TYPE", "Enum");
    }
    Simplane.getAutoPilotApproachType = getAutoPilotApproachType;
    function getAutoPilotApproachLoaded() {
        return SimVar.GetSimVarValue("GPS IS APPROACH LOADED", "bool");
    }
    Simplane.getAutoPilotApproachLoaded = getAutoPilotApproachLoaded;
    function getAutoPilotNavAidState(_user, _switch) {
        var varName = "L:XMLVAR_NAV_AID_SWITCH_" + ((_user == 1) ? "L" : "R") + _switch + "_State";
        return SimVar.GetSimVarValue(varName, "number");
    }
    Simplane.getAutoPilotNavAidState = getAutoPilotNavAidState;
    function getAutoPilotIsHeadingAligned() {
        const heading = getHeadingMagnetic();
        const targetHeading = getAutoPilotHeadingLockValue(false);
        let delta = Math.abs(targetHeading - heading);
        while (delta >= 360) {
            delta -= 360;
        }
        return delta < 1;
    }
    Simplane.getAutoPilotIsHeadingAligned = getAutoPilotIsHeadingAligned;
    function getNextWaypointName() {
        return SimVar.GetSimVarValue("GPS WP NEXT ID", "string");
    }
    Simplane.getNextWaypointName = getNextWaypointName;
    function getNextWaypointTrack() {
        var angle = SimVar.GetSimVarValue("GPS WP BEARING", "degree");
        return angle;
    }
    Simplane.getNextWaypointTrack = getNextWaypointTrack;
    function getNextWaypointDistance() {
        var distance = SimVar.GetSimVarValue("GPS WP DISTANCE", "nautical miles");
        return distance;
    }
    Simplane.getNextWaypointDistance = getNextWaypointDistance;
    function getNextWaypointETA() {
        var time = SimVar.GetSimVarValue("GPS WP ETA", "seconds");
        return time;
    }
    Simplane.getNextWaypointETA = getNextWaypointETA;
    function getFlightTime() {
        return SimVar.GetSimVarValue("GENERAL ENG ELAPSED TIME:1", "seconds");
    }
    Simplane.getFlightTime = getFlightTime;
    function getCurrentUTC() {
        return SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
    }
    Simplane.getCurrentUTC = getCurrentUTC;
    function getEngineCount() {
        return SimVar.GetSimVarValue("NUMBER OF ENGINES", "number");
    }
    Simplane.getEngineCount = getEngineCount;
    function getEngineActive(_engineIndex) {
        return SimVar.GetSimVarValue("ENG COMBUSTION:" + (_engineIndex + 1), "bool");
    }
    Simplane.getEngineActive = getEngineActive;
    function getEngineThrottle(_engineIndex) {
        var name = "GENERAL ENG THROTTLE LEVER POSITION:" + (_engineIndex + 1);
        var fThrottle = SimVar.GetSimVarValue(name, "percent");
        return fThrottle;
    }
    Simplane.getEngineThrottle = getEngineThrottle;
    function getEngineThrottleMode(_engineIndex) {
        var name = "GENERAL ENG THROTTLE MANAGED MODE:" + (_engineIndex + 1);
        var mode = SimVar.GetSimVarValue(name, "number");
        return mode;
    }
    Simplane.getEngineThrottleMode = getEngineThrottleMode;
    function getEngineCommandedN1(_engineIndex) {
        var name = "TURB ENG COMMANDED N1:" + (_engineIndex + 1);
        var fThrottle = SimVar.GetSimVarValue(name, "percent");
        return fThrottle;
    }
    Simplane.getEngineCommandedN1 = getEngineCommandedN1;
    function getEngineThrottleCommandedN1(_engineIndex) {
        var name = "TURB ENG THROTTLE COMMANDED N1:" + (_engineIndex + 1);
        var fThrottle = SimVar.GetSimVarValue(name, "percent");
        return fThrottle;
    }
    Simplane.getEngineThrottleCommandedN1 = getEngineThrottleCommandedN1;
    function getEngineThrottleMaxThrust(_engineIndex) {
        return SimVar.GetSimVarValue("AUTOPILOT THROTTLE MAX THRUST", "number") * 100;
    }
    Simplane.getEngineThrottleMaxThrust = getEngineThrottleMaxThrust;
    function getEngineThrustTakeOffMode(_engineIndex) {
        return SimVar.GetSimVarValue("L:AIRLINER_THRUST_TAKEOFF_MODE", "number");
    }
    Simplane.getEngineThrustTakeOffMode = getEngineThrustTakeOffMode;
    function getEngineThrustClimbMode(_engineIndex) {
        return SimVar.GetSimVarValue("L:AIRLINER_THRUST_CLIMB_MODE", "number");
    }
    Simplane.getEngineThrustClimbMode = getEngineThrustClimbMode;
    function getAutopilotThrottle(_engineIndex) {
        return getEngineThrottle(_engineIndex);
    }
    Simplane.getAutopilotThrottle = getAutopilotThrottle;
    function getAutopilotCommandedN1(_engineIndex) {
        return getEngineCommandedN1(_engineIndex);
    }
    Simplane.getAutopilotCommandedN1 = getAutopilotCommandedN1;
    function getEngineType() {
        var type = SimVar.GetSimVarValue("ENGINE TYPE", "Enum");
        return type;
    }
    Simplane.getEngineType = getEngineType;
    function getEngineRPM(_engineIndex) {
        var engineType = getEngineType();
        var usePropRpm = SimVar.GetGameVarValue("AIRCRAFT USE PROPELLER RPM", "bool");
        var name;
        if (engineType == EngineType.ENGINE_TYPE_JET) {
            name = "ENG N1 RPM:" + (_engineIndex + 1);
        } else if (engineType == EngineType.ENGINE_TYPE_TURBOPROP) {
            name = "PROP RPM:" + (_engineIndex + 1);
        } else if (engineType == EngineType.ENGINE_TYPE_PISTON) {
            if (usePropRpm) {
                name = "PROP RPM:" + (_engineIndex + 1);
            } else {
                name = "GENERAL ENG RPM:" + (_engineIndex + 1);
            }
        } else {
            name = "GENERAL ENG RPM:" + (_engineIndex + 1);
        }
        return SimVar.GetSimVarValue(name, "rpm");
    }
    Simplane.getEngineRPM = getEngineRPM;
    function getEnginePower(_engineIndex) {
        var percent = 0;
        var engineType = getEngineType();
        if (engineType == EngineType.ENGINE_TYPE_TURBOPROP) {
            var name = "TURB ENG MAX TORQUE PERCENT:" + (_engineIndex + 1);
            percent = SimVar.GetSimVarValue(name, "percent");
        } else if (engineType == EngineType.ENGINE_TYPE_JET) {
            var name = "ENG N1 RPM:" + (_engineIndex + 1);
            percent = SimVar.GetSimVarValue(name, "percent");
        } else if (engineType == EngineType.ENGINE_TYPE_PISTON) {
            var maxHP = SimVar.GetGameVarValue("AIRCRAFT MAX RATED HP", "ft lb per second") / 550;
            maxHP /= SimVar.GetSimVarValue("NUMBER OF ENGINES", "number");
            var currentHP = SimVar.GetSimVarValue("ENG TORQUE:" + (_engineIndex + 1), "Foot pounds") * SimVar.GetSimVarValue("GENERAL ENG RPM:" + (_engineIndex + 1), "rpm") / 5252;
            percent = (currentHP / maxHP) * 100;
        }
        return percent;
    }
    Simplane.getEnginePower = getEnginePower;
    function getMinCruiseRPM() {
        return SimVar.GetGameVarValue("AIRCRAFT MIN CRUISE RPM", "rpm");
    }
    Simplane.getMinCruiseRPM = getMinCruiseRPM;
    function getMaxCruiseRPM() {
        return SimVar.GetGameVarValue("AIRCRAFT MAX CRUISE RPM", "rpm");
    }
    Simplane.getMaxCruiseRPM = getMaxCruiseRPM;
    function getMaxIndicatedRPM() {
        return SimVar.GetGameVarValue("AIRCRAFT MAX INDICATED RPM", "rpm");
    }
    Simplane.getMaxIndicatedRPM = getMaxIndicatedRPM;
    function getMaxRatedRPM() {
        return SimVar.GetGameVarValue("AIRCRAFT MAX RATED RPM", "rpm");
    }
    Simplane.getMaxRatedRPM = getMaxRatedRPM;
    function getPropellerType() {
        var type = SimVar.GetGameVarValue("AIRCRAFT PROPELLER TYPE", "Enum");
        return type;
    }
    Simplane.getPropellerType = getPropellerType;
    function getNbPropellers() {
        var type = SimVar.GetGameVarValue("AIRCRAFT NB PROPELLERS", "Enum");
        return type;
    }
    Simplane.getNbPropellers = getNbPropellers;
    function getInclinometer() {
        return SimVar.GetSimVarValue("TURN COORDINATOR BALL", "position");
    }
    Simplane.getInclinometer = getInclinometer;
    function getAngleOfAttack() {
        return SimVar.GetGameVarValue("AIRCRAFT AOA ANGLE", "angl16");
    }
    Simplane.getAngleOfAttack = getAngleOfAttack;
    function getOrientationAxis() {
        return SimVar.GetGameVarValue("AIRCRAFT ORIENTATION AXIS", "XYZ");
    }
    Simplane.getOrientationAxis = getOrientationAxis;
    function getAltitude() {
        var altitude = SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet");
        return altitude;
    }
    Simplane.getAltitude = getAltitude;
    function getGroundReference() {
        var groundReference = SimVar.GetSimVarValue("GROUND ALTITUDE", "feet");
        return groundReference;
    }
    Simplane.getGroundReference = getGroundReference;
    function getTurnRate() {
        var turnRate = SimVar.GetSimVarValue("TURN INDICATOR RATE", "radians per second");
        return turnRate;
    }
    Simplane.getTurnRate = getTurnRate;
    function getHeadingMagnetic() {
        var angle = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree");
        return angle;
    }
    Simplane.getHeadingMagnetic = getHeadingMagnetic;
    function getPitch() {
        return SimVar.GetSimVarValue("ATTITUDE INDICATOR PITCH DEGREES:1", "degree");
    }
    Simplane.getPitch = getPitch;
    function getBank() {
        return SimVar.GetSimVarValue("ATTITUDE INDICATOR BANK DEGREES:1", "degree");
    }
    Simplane.getBank = getBank;
    function getFlightDirectorPitch() {
        return SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR PITCH EX1", "degree");
    }
    Simplane.getFlightDirectorPitch = getFlightDirectorPitch;
    function getFlightDirectorBank() {
        return SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR BANK EX1", "degree");
    }
    Simplane.getFlightDirectorBank = getFlightDirectorBank;
    function getIsGrounded() {
        return getAltitudeAboveGround() < 10;
    }
    Simplane.getIsGrounded = getIsGrounded;
    var _simplaneAltitudeAboveGround;
    var _simplaneAltitudeAboveGroundTimeLastCall = 0;
    function getAltitudeAboveGround(forceSimVarCall = false) {
        let doSimVarCall = false;
        let t = 0;
        if (forceSimVarCall || _simplaneAltitudeAboveGround === undefined) {
            doSimVarCall = true;
        } else {
            t = performance.now();
            if (t - _simplaneAltitudeAboveGroundTimeLastCall > 1000) {
                doSimVarCall = true;
            }
        }
        if (doSimVarCall) {
            _simplaneAltitudeAboveGround = Math.max(0, SimVar.GetSimVarValue("PLANE ALT ABOVE GROUND MINUS CG", "Feet"));
            _simplaneAltitudeAboveGroundTimeLastCall = t;
        }
        return _simplaneAltitudeAboveGround;
    }
    Simplane.getAltitudeAboveGround = getAltitudeAboveGround;
    function getCrossoverAltitude(_cas, _mach) {
        return SimVar.GetGameVarValue("AIRCRAFT CROSSOVER ALTITUDE", "Feets", _cas, _mach);
    }
    Simplane.getCrossoverAltitude = getCrossoverAltitude;
    function getThrustReductionAltitude() {
        return SimVar.GetSimVarValue("L:AIRLINER_THR_RED_ALT", "number");
    }
    Simplane.getThrustReductionAltitude = getThrustReductionAltitude;
    function getFlapsNbHandles() {
        return SimVar.GetSimVarValue("FLAPS NUM HANDLE POSITIONS", "number");
    }
    Simplane.getFlapsNbHandles = getFlapsNbHandles;
    function getFlapsHandlePercent() {
        return SimVar.GetSimVarValue("FLAPS HANDLE PERCENT", "percent over 100");
    }
    Simplane.getFlapsHandlePercent = getFlapsHandlePercent;
    function getFlapsHandleAngle(_flapIndex) {
        return SimVar.GetGameVarValue("AIRCRAFT FLAPS HANDLE ANGLE", "Degree", _flapIndex);
    }
    Simplane.getFlapsHandleAngle = getFlapsHandleAngle;
    function getFlapsAngle() {
        return SimVar.GetSimVarValue("TRAILING EDGE FLAPS LEFT ANGLE", "radians");
    }
    Simplane.getFlapsAngle = getFlapsAngle;
    function getFlapsAnglePercent() {
        return SimVar.GetSimVarValue("TRAILING EDGE FLAPS LEFT PERCENT", "percent");
    }
    Simplane.getFlapsAnglePercent = getFlapsAnglePercent;
    function getTrim() {
        return SimVar.GetSimVarValue("ELEVATOR TRIM PCT", "percent over 100");
    }
    Simplane.getTrim = getTrim;
    function getTrimIndicator() {
        return SimVar.GetSimVarValue("ELEVATOR TRIM INDICATOR", "number");
    }
    Simplane.getTrimIndicator = getTrimIndicator;
    function getTrimNeutral() {
        return SimVar.GetGameVarValue("AIRCRAFT ELEVATOR TRIM NEUTRAL", "percent over 100");
    }
    Simplane.getTrimNeutral = getTrimNeutral;
    function setTransponderToRegion() {
        var code = 0;
        const region = getWorldRegion();
        if (region == WorldRegion.NORTH_AMERICA || region == WorldRegion.AUSTRALIA) {
            code = (1 * 4096) + (2 * 256) + (0 * 16) + 0;
        } else {
            code = (7 * 4096) + (0 * 256) + (0 * 16) + 0;
        }
        SimVar.SetSimVarValue("K:XPNDR_SET", "Bco16", code);
    }
    Simplane.setTransponderToRegion = setTransponderToRegion;
    function setTransponderToZero() {
        SimVar.SetSimVarValue("K:XPNDR_SET", "Bco16", 0);
    }
    Simplane.setTransponderToZero = setTransponderToZero;
    function getTotalAirTemperature() {
        return SimVar.GetSimVarValue("TOTAL AIR TEMPERATURE", "celsius");
    }
    Simplane.getTotalAirTemperature = getTotalAirTemperature;
    function getAmbientTemperature() {
        return SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius");
    }
    Simplane.getAmbientTemperature = getAmbientTemperature;
    function getFlexTemperature() {
        return SimVar.GetSimVarValue("L:AIRLINER_TO_FLEX_TEMP", "Number");
    }
    Simplane.getFlexTemperature = getFlexTemperature;
    function getFuelPercent() {
        var fFuelCapacity = SimVar.GetSimVarValue("FUEL TOTAL CAPACITY", "gallons");
        if (fFuelCapacity > 0) {
            var fFuelQuantity = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons");
            var fPercent = (fFuelQuantity / fFuelCapacity) * 100;
            fPercent = Math.max(0, Math.min(100, fPercent));
            return fPercent;
        }
        return 0;
    }
    Simplane.getFuelPercent = getFuelPercent;
    function getFuelQuantity() {
        var fFuelCapacity = SimVar.GetSimVarValue("FUEL TOTAL CAPACITY", "gallons");
        if (fFuelCapacity > 0) {
            var fFuelQuantity = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons");
            return fFuelQuantity;
        }
        return 0;
    }
    Simplane.getFuelQuantity = getFuelQuantity;
    function getTotalFuel() {
        return SimVar.GetSimVarValue("FUEL TOTAL QUANTITY WEIGHT", "kg");
    }
    Simplane.getTotalFuel = getTotalFuel;
    function getFuelUsed(_engineIndex) {
        return SimVar.GetSimVarValue("GENERAL ENG FUEL USED SINCE START:" + (_engineIndex + 1), "kg");
    }
    Simplane.getFuelUsed = getFuelUsed;
    function getCompassAngle() {
        return SimVar.GetSimVarValue("WISKEY COMPASS INDICATION DEGREES", "radians");
    }
    Simplane.getCompassAngle = getCompassAngle;
    function getPressureValue(_units = "inches of mercury") {
        var value = SimVar.GetSimVarValue("KOHLSMAN SETTING HG", _units);
        return value;
    }
    Simplane.getPressureValue = getPressureValue;
    function getPressureSelectedUnits() {
        if (SimVar.GetSimVarValue("L:XMLVAR_Baro_Selector_HPA_1", "Bool")) {
            return "millibar";
        }
        return "inches of mercury";
    }
    Simplane.getPressureSelectedUnits = getPressureSelectedUnits;
    function getPressureSelectedMode(_aircraft) {
        if (_aircraft == Aircraft.A320_NEO) {
            const val = SimVar.GetSimVarValue("L:XMLVAR_Baro1_Mode", "number");
            if (val == 0) {
                return "QFE";
            } else if (val == 1) {
                return "QNH";
            } else {
                return "STD";
            }
        }
        const val = SimVar.GetSimVarValue("L:XMLVAR_Baro1_ForcedToSTD", "Bool");
        if (val) {
            return "STD";
        }
        return "";
    }
    Simplane.getPressureSelectedMode = getPressureSelectedMode;
    function getHasGlassCockpit() {
        return SimVar.GetGameVarValue("AIRCRAFT HAS GLASSCOCKPIT", "boolean");
    }
    Simplane.getHasGlassCockpit = getHasGlassCockpit;
    function getPressurisationCabinAltitude() {
        return SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE", "Feet");
    }
    Simplane.getPressurisationCabinAltitude = getPressurisationCabinAltitude;
    function getPressurisationCabinAltitudeGoal() {
        return SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE GOAL", "Feet");
    }
    Simplane.getPressurisationCabinAltitudeGoal = getPressurisationCabinAltitudeGoal;
    function getPressurisationCabinAltitudeRate() {
        return SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE RATE", "Feet");
    }
    Simplane.getPressurisationCabinAltitudeRate = getPressurisationCabinAltitudeRate;
    function getPressurisationDifferential() {
        return SimVar.GetSimVarValue("PRESSURIZATION PRESSURE DIFFERENTIAL", "psi");
    }
    Simplane.getPressurisationDifferential = getPressurisationDifferential;
    function getWeight() {
        return SimVar.GetSimVarValue("TOTAL WEIGHT", "kg");
    }
    Simplane.getWeight = getWeight;
    function getMaxWeight() {
        return SimVar.GetSimVarValue("MAX GROSS WEIGHT", "kg");
    }
    Simplane.getMaxWeight = getMaxWeight;
    function getGearPosition() {
        return SimVar.GetSimVarValue("GEAR POSITION", "percent");
    }
    Simplane.getGearPosition = getGearPosition;
    function getUnitIsMetric() {
        return SimVar.GetGameVarValue("GAME UNIT IS METRIC", "boolean");
    }
    Simplane.getUnitIsMetric = getUnitIsMetric;
    var _simplaneCurrentFlightPhase;
    var _simplaneCurrentFlightPhaseTimeLastCall = 0;
    function getCurrentFlightPhase(forceSimVarCall = false) {
        let doSimVarCall = false;
        let t = 0;
        if (forceSimVarCall || _simplaneCurrentFlightPhase === undefined) {
            doSimVarCall = true;
        } else {
            t = performance.now();
            if (t - _simplaneCurrentFlightPhaseTimeLastCall > 1000) {
                doSimVarCall = true;
            }
        }
        if (doSimVarCall) {
            _simplaneCurrentFlightPhase = SimVar.GetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "number");
            _simplaneCurrentFlightPhaseTimeLastCall = t;
        }
        return _simplaneCurrentFlightPhase;
    }
    Simplane.getCurrentFlightPhase = getCurrentFlightPhase;
    function getWorldRegion() {
        const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
        const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        if (lat >= 20 && lat <= 50 && long <= -60 && long >= -130) {
            return WorldRegion.NORTH_AMERICA;
        } else if (lat <= -8 && lat >= -50 && long >= 23 && long <= 160) {
            return WorldRegion.AUSTRALIA;
        }
        return WorldRegion.OTHER;
    }
    Simplane.getWorldRegion = getWorldRegion;
})(Simplane || (Simplane = {}));
//# sourceMappingURL=SimPlane.js.map
