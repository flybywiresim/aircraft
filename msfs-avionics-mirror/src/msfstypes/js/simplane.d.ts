declare class RangeDisplay {
    constructor(_type?: string);
    __Type: string;
    Initialized: boolean;
    min: number;
    max: number;
    lowLimit: number;
    highLimit: number;
}
declare class ColorRangeDisplay extends RangeDisplay {
    constructor(_type?: string);
    greenStart: number;
    greenEnd: number;
}
declare class ColorRangeDisplay2 extends ColorRangeDisplay {
    constructor(_type?: string);
    yellowStart: number;
    yellowEnd: number;
    redStart: number;
    redEnd: number;
}
declare class ColorRangeDisplay3 extends ColorRangeDisplay2 {
    constructor(_type?: string);
    lowRedStart: number;
    lowRedEnd: number;
    lowYellowStart: number;
    lowYellowEnd: number;
}
declare class ColorRangeDisplay4 extends ColorRangeDisplay2 {
    constructor(_type?: string);
    whiteStart: number;
    whiteEnd: number;
}
declare class FlapsRangeDisplay extends RangeDisplay {
    constructor(_type?: string);
    takeOffValue: number;
}
declare class ThrottleLevelsInfo {
    __Type: string;
    initialised: boolean;
    minValues: Array<number>;
    names: Array<string>;
}
declare class FlapsLevelsInfo {
    __Type: string;
    initialised: boolean;
    slatsAngle: Array<number>;
    flapsAngle: Array<number>;
}
declare class TakeOffSpeedsInfo {
    __Type: string;
    initialised: boolean;
    minVal: number;
    minWeight: number;
    maxVal: number;
    maxWeight: number;
}
declare class GlassCockpitMisc {
    __Type: string;
    initialised: boolean;
    hasGMeter: boolean;
    vCockpitHud: boolean;
    highAltitudeHud: boolean;
    hudAirspeedColorFromLVar: boolean;
    hudShowFuel: boolean;
    hudShowAOA: boolean;
}
declare class GlassCockpitSettings {
    FuelFlow: ColorRangeDisplay;
    FuelQuantity: ColorRangeDisplay2;
    FuelTemperature: ColorRangeDisplay3;
    FuelPressure: ColorRangeDisplay3;
    OilPressure: ColorRangeDisplay3;
    OilTemperature: ColorRangeDisplay3;
    EGTTemperature: ColorRangeDisplay2;
    CHTTemperature: ColorRangeDisplay2;
    Vacuum: ColorRangeDisplay;
    ManifoldPressure: ColorRangeDisplay;
    AirSpeed: ColorRangeDisplay4;
    Torque: ColorRangeDisplay2;
    RPM: ColorRangeDisplay2;
    TurbineNg: ColorRangeDisplay2;
    TurbineN1: ColorRangeDisplay2;
    TurbineN2: ColorRangeDisplay2;
    ITTEngineOff: ColorRangeDisplay3;
    ITTEngineOn: ColorRangeDisplay3;
    MainBusVoltage: ColorRangeDisplay3;
    HotBatteryBusVoltage: ColorRangeDisplay3;
    BatteryBusAmps: ColorRangeDisplay2;
    GenAltBusAmps: ColorRangeDisplay2;
    CoolantLevel: RangeDisplay;
    CoolantTemperature: ColorRangeDisplay3;
    GearOilTemperature: ColorRangeDisplay2;
    CabinAltitude: ColorRangeDisplay;
    CabinAltitudeChangeRate: RangeDisplay;
    CabinPressureDiff: ColorRangeDisplay;
    ThrottleLevels: ThrottleLevelsInfo;
    FlapsLevels: FlapsLevelsInfo;
    TakeOffSpeeds: TakeOffSpeedsInfo;
    Misc: GlassCockpitMisc;
}
declare class FuelLevels {
    fuel_tank_selector: number[];
    Center: number;
    Center2: number;
    Center3: number;
    LeftMain: number;
    RightMain: number;
    LeftAux: number;
    RightAux: number;
    LeftTip: number;
    RightTip: number;
    External1: number;
    External2: number;
}
declare class DesignSpeeds {
    VS0: number;
    VS1: number;
    VFe: number;
    VNe: number;
    VNo: number;
    VMin: number;
    VMax: number;
    Vr: number;
    Vx: number;
    Vy: number;
    Vapp: number;
    BestGlide: number;
    Vyse: number;
    Vmc: number;
}
declare enum EngineType {
    ENGINE_TYPE_PISTON = 0,
    ENGINE_TYPE_JET = 1,
    ENGINE_TYPE_NONE = 2,
    ENGINE_TYPE_HELO_TURBINE = 3,
    ENGINE_TYPE_ROCKET = 4,
    ENGINE_TYPE_TURBOPROP = 5
}
declare enum PropellerType {
    PROPELLER_TYPE_CONSTANT_SPEED = 0,
    PROPELLER_TYPE_FIXED_PITCH = 1
}
declare enum Aircraft {
    CJ4 = 0,
    A320_NEO = 1,
    B747_8 = 2,
    AS01B = 3,
    AS02A = 4,
    AS03D = 5
}
declare enum ThrottleMode {
    UNKNOWN = 0,
    REVERSE = 1,
    IDLE = 2,
    AUTO = 3,
    CLIMB = 4,
    FLEX_MCT = 5,
    TOGA = 6,
    HOLD = 7
}
declare enum AutopilotMode {
    MANAGED = 0,
    SELECTED = 1,
    HOLD = 2
}
declare enum MinimumReferenceMode {
    RADIO = 0,
    BARO = 1
}
declare enum FlightState {
    FLIGHT_STATE_BRIEFING = 0,
    FLIGHT_STATE_INTRO_PLANE = 1,
    FLIGHT_STATE_INTRO = 2,
    FLIGHT_STATE_PREFLIGHT_GATE = 3,
    FLIGHT_STATE_PREFLIGHT_PUSHBACK = 4,
    FLIGHT_STATE_PREFLIGHT_TAXI = 5,
    FLIGHT_STATE_PREFLIGHT_HOLDSHORT = 6,
    FLIGHT_STATE_FLIGHT_RUNWAY = 7,
    FLIGHT_STATE_FLIGHT_INITIAL_CLIMB = 8,
    FLIGHT_STATE_FLIGHT_CLIMB = 9,
    FLIGHT_STATE_FLIGHT_CRUISE = 10,
    FLIGHT_STATE_FLIGHT_DESCENT = 11,
    FLIGHT_STATE_JOINPLANE = 12,
    FLIGHT_STATE_LANDING_APPROACH = 13,
    FLIGHT_STATE_LANDING_FINAL = 14,
    FLIGHT_STATE_LANDING_TOUCHDOWN = 15,
    FLIGHT_STATE_LANDING_GROUNDROLL = 16,
    FLIGHT_STATE_LANDING_TAXI = 17,
    FLIGHT_STATE_LANDING_GATE = 18,
    FLIGHT_STATE_LANDING_REST = 19,
    FLIGHT_STATE_OUTRO = 20,
    FLIGHT_STATE_WAITING = 21,
    FLIGHT_STATE_TELEPORTTOSTATE = 22,
    FLIGHT_STATE_FREEFLIGHT = 23,
    FLIGHT_STATE_LANDINGCHALLENGE = 24,
    FLIGHT_STATE_BUSHTRIP = 25
}
declare enum FlightPhase {
    FLIGHT_PHASE_PREFLIGHT = 0,
    FLIGHT_PHASE_TAXI = 1,
    FLIGHT_PHASE_TAKEOFF = 2,
    FLIGHT_PHASE_CLIMB = 3,
    FLIGHT_PHASE_CRUISE = 4,
    FLIGHT_PHASE_DESCENT = 5,
    FLIGHT_PHASE_APPROACH = 6,
    FLIGHT_PHASE_GOAROUND = 7
}
declare enum ApproachType {
    APPROACH_TYPE_UNKNOWN = 0,
    APPROACH_TYPE_GPS = 1,
    APPROACH_TYPE_VOR = 2,
    APPROACH_TYPE_NDB = 3,
    APPROACH_TYPE_ILS = 4,
    APPROACH_TYPE_LOCALIZER = 5,
    APPROACH_TYPE_SDF = 6,
    APPROACH_TYPE_LDA = 7,
    APPROACH_TYPE_VORDME = 8,
    APPROACH_TYPE_NDBDME = 9,
    APPROACH_TYPE_RNAV = 10,
    APPROACH_TYPE_LOCALIZER_BACK_COURSE = 11
}
declare enum RunwayDesignator {
    RUNWAY_DESIGNATOR_NONE = 0,
    RUNWAY_DESIGNATOR_LEFT = 1,
    RUNWAY_DESIGNATOR_RIGHT = 2,
    RUNWAY_DESIGNATOR_CENTER = 3,
    RUNWAY_DESIGNATOR_WATER = 4,
    RUNWAY_DESIGNATOR_A = 5,
    RUNWAY_DESIGNATOR_B = 6
}
declare enum WorldRegion {
    NORTH_AMERICA = 0,
    AUSTRALIA = 1,
    HAWAII = 2,
    OTHER = 3
}
declare enum NAV_AID_STATE {
    OFF = 0,
    ADF = 1,
    VOR = 2
}
declare enum NAV_AID_MODE {
    NONE = 0,
    MANUAL = 1,
    REMOTE = 2
}
declare namespace Simplane {
    function getDSVNO(): number;
    function getMGSP(): number;
    function LowVaccum(): boolean;
    function getStructuralDeiceSwitch(): boolean;
    function getDesignSpeeds(): DesignSpeeds;
    function getBTNWXActive(): boolean;
    function setBTNWXActive(val: boolean): void;
    function getBTNTerrOnNdActive(): boolean;
    function setBTNTerrOnNdActive(val: boolean): void;
    function get747MFDNavMode(): number;
    function set747MFDNavMode(val: number): void;
    function get747MFDRange(): number;
    function getTrueSpeed(): number;
    function getIndicatedSpeed(): number;
    function getVerticalSpeed(): number;
    function getGroundSpeed(): number;
    function getTrackAngle(): number;
    function getMachSpeed(): number;
    function getFlightPathAngleY(): number;
    function getV1AirspeedR(): number;
    function getV1AirspeedP(phase: number): number;
    function getVRAirspeedP(phase: number): number;
    function getV1Airspeed(): number;
    function getVRAirspeed(): number;
    function getV2Airspeed(): number;
    function getV2AirspeedP(phase: number): number;
    function getDecisionHeight(): number;
    function getREFAirspeed(): number;
    function getVXAirspeed(): number;
    function getFMCGreenDotSpeed(): number;
    function getFMCApprGreenDotSpeed(): number;
    function getGreenDotSpeed(): number;
    function getCruiseMach(): number;
    function getCrossoverSpeed(): number;
    function getCrossoverSpeedFactor(_cas: number, _mach: number): number;
    function getKiasToMach(_kias: number): number;
    function getMachToKias(_kias: number): number;
    function getFlapsSpeedLim(index: number): number;
    function getFlapsLimitSpeed(_aircraft: Aircraft, _flapIndex: number): number;
    function getFlapsHandleIndex(forceSimVarCall?: boolean): number;
    function getFlapsExtendSpeed(_aircraft: Aircraft, forceSimVarCall?: boolean): number;
    function getNextFlapsExtendSpeed(_aircraft: Aircraft, forceSimVarCall?: boolean): number;
    function getMaxSpeed(_aircraft: Aircraft): number;
    function getLowestSelectableSpeed(): number;
    function getStallProtectionMinSpeed(): number;
    function getStallProtectionMaxSpeed(): number;
    function getStallSpeed(): number;
    function getStallSpeedPredicted(index: number): number;
    function getWindDirection(): number;
    function getWindStrength(): number;
    function getAPRadioNavSource(): number;
    function setAPRadioNavSource(val: number): void;
    function getAPLNAVActive(): number;
    function setAPLNAVActive(val: number): void;
    function getAPLNAVArmed(): number;
    function setAPLNAVArmed(val: number): void;
    function getAPFLCHActive(): number;
    function setAPFLCHActive(val: number): void;
    function getAPAltHoldActive(): number;
    function setAPAltHoldActive(val: number): void;
    function getAPVNAVActive(): number;
    function setAPVNAVActive(val: number): void;
    function getAPVNAVArmed(): number;
    function setAPVNAVArmed(val: number): void;
    function getFMCFlightPlanIsTemp(): number;
    function getAutoPilotAvailable(): number;
    function setAutoPilotSelectedNav(_index: number): Promise<any>;
    function getAutoPilotNavSelected(): number;
    function getAutoPilotNavSelectedTMP(): number;
    function getAutoPilotSelectedNav(): number;
    function getAutoPilotActive(_apIndex?: number): boolean;
    function getAutoPilotAirspeedSlotIndex(): number;
    function getAutoPilotAirspeedManaged(): boolean;
    function getAutoPilotAirspeedSelected(): boolean;
    function getAutoPilotAirspeedHold2(): boolean;
    function getAutoPilotAirspeedHold1(): boolean;
    function getAutoPilotAirspeedHold(): boolean;
    function getAutoPilotAirspeedHoldActive(isManaged?: boolean): boolean;
    function getAutoPilotAirspeedHoldValue(): number;
    function getAutoPilotSelectedAirspeedHoldValue(): number;
    function getAutoPilotManagedAirspeedHoldValue(): number;
    function getAutoPilotMachModeActive(): boolean;
    function setAutoPilotMachModeActive(val: boolean): void;
    function getAS1000WarIndex(): number;
    function setAS1000WarIndex(val: number): void;
    function getAS1000WarMasterSet(): number;
    function setAS1000WarMasterSet(val: number): void;
    function getAutoPilotManSpdIsMachOn(): number;
    function setAutoPilotManSpdIsMachOn(val: number): void;
    function getECAMCurPage(): number;
    function setECAMCurPage(val: number): void;
    function getAutoPilotPanMachHold(): number;
    function setAutoPilotPanMachHold(val: number): void;
    function getAutoPilotManSpdIsMachOff(): number;
    function setAutoPilotManSpdIsMachOff(val: number): void;
    function getAutoPilotFMCForceNextUpdate(): number;
    function setAutoPilotFMCForceNextUpdate(val: number): void;
    function getAutoPilotMachHold(): boolean;
    function getAutoPilotMachHoldValue(): number;
    function getAutoPilotSelectedMachHoldValue(): number;
    function getAutoPilotManagedMachHoldValue(): number;
    function getAutoPilotHeadingSlotIndex(): number;
    function getAutoPilotHeadingManaged(): boolean;
    function getAutoPilotHeadingSelected(): boolean;
    function getAutoPilotHeadingLockActive(): boolean;
    function getAutoPilotHeadingLockValueRadians(): number;
    function getAutoPilotHeadingLockValueDegrees(): number;
    function getAutoPilotHeadingLockValue(_radians?: boolean): number;
    function getAutoPilotSelectedHeadingLockValueRadians(): number;
    function getAutoPilotSelectedHeadingLockValueDegrees(): number;
    function getAutoPilotSelectedHeadingLockValue(_radians?: boolean): number;
    function getAutoPilotManagedHeadingLockValueRadians(): number;
    function getAutoPilotManagedHeadingLockValueDegrees(): number;
    function getAutoPilotManagedHeadingValue(_radians?: boolean): number;
    function getAutoPilotDisplayedHeadingLockValueRadians(): number;
    function getAutoPilotDisplayedHeadingLockValueDegrees(): number;
    function getAutoPilotDisplayedHeadingValue(_radians?: boolean): number;
    function getAutoPilotAltitudeSlotIndex(): number;
    function getAutoPilotAltitudeManaged(): boolean;
    function getAutoPilotAltitudeSelected(): boolean;
    function getAutoPilotAltitudeArm(): boolean;
    function getAutoPilotAltitudeArmed(): boolean;
    function getAutoPilotAltitudeLockActive(): boolean;
    function getAutoPilotFLCActive(): boolean;
    function getAutoPilotAltitudeLockValueFeet(): number;
    function getAutoPilotAltitudeLockValue(_units?: string): number;
    function getAutoPilotSelectedAltitudeLockValueFeet(): number;
    function getAutoPilotSelectedAltitudeLockValue(_units?: string): number;
    function getAutoPilotDisplayedAltitudeLockValueFeet(): number;
    function getAutoPilotDisplayedAltitudeLockValue(_units?: string): number;
    function getAutoPilotAltitudeLockUnits(): string;
    function getAutoPilotVerticalSpeedHoldActive(): boolean;
    function getAutoPilotVerticalSpeedHoldValue(): number;
    function getAutoPilotSelectedVerticalSpeedHoldValue(): number;
    function getAutoPilotDisplayedVerticalSpeedHoldValue(): number;
    function getAutoPilotLateralModeActive(): boolean;
    function getAutoPilotNavHasLoc(_fdIndex: number): boolean;
    function getAutoPilotFlightDirectorActive(_fdIndex: number): boolean;
    function getAutoPilotFlightDirectorBankValue(): number;
    function getAutoPilotFlightDirectorPitchValue(): number;
    function getAutopilotGPSDriven(): boolean;
    function getAutopilotGPSActive(): boolean;
    function getAutoPilotTrackAngle(): number;
    function getAutoPilotFlightPathAngle(): number;
    function getAutoPilotThrottleArmedA(): boolean;
    function getAutoPilotThrottleArmedB(_fdIndex: number): boolean;
    function getAutoPilotThrottleArmed(_index?: number): boolean;
    function getAutoPilotThrottleLocked(): boolean;
    function getAutoPilotThrottleActiveA(): boolean;
    function getAutoPilotThrottleActiveB(_fdIndex: number): boolean;
    function getAutoPilotThrottleActive(_index?: number): boolean;
    function getAutoPilotTOGAActive(): boolean;
    function getAutoPilotAPPRIsLocalizer(): boolean;
    function getAutoPilotAPPRCaptured(): boolean;
    function getAutoPilotAPPRAct(): boolean;
    function getAutoPilotAPPRActive(): boolean;
    function getAutoPilotAPPRAr(): boolean;
    function getAutoPilotAPPRArm(): boolean;
    function getAutoPilotAPPRHold(): boolean;
    function getAutoPilotTRKFPAModeActive(): boolean;
    function getAutoPilotTRKModeActive(): boolean;
    function getAutoPilotFPAModeActive(): boolean;
    function getAutoPilotGlideslopeActive(): boolean;
    function getAutoPilotGlideslopeArm(): boolean;
    function getAutoPilotGlideslopeHold(): boolean;
    function getAutoPilotApproachType(): ApproachType;
    function getGPSWpNextID(): string;
    function getAutoPilotApproachLoaded(): boolean;
    function getAutoPilotNavAidStateL(_Index: number): number;
    function getAutoPilotNavAidStateR(_Index: number): number;
    function getAutoPilotNavAidState(_aircraft: Aircraft, _user: number, _switch: number): NAV_AID_STATE;
    function getAutoPilotIsHeadingAligned(): boolean;
    function getNextWaypointName(): string;
    function getNextWaypointTrack(): number;
    function getNextWaypointDistance(): number;
    function getNextWaypointCrossTrk(): number;
    function getNextWaypointETA(): number;
    function getFlightTime(): number;
    function getCurrentUTC(): number;
    function getCurrentLocalTime(): number;
    function getCurrentTimeDeviation(): number;
    function getTurbEng1IsIgn(): boolean;
    function getEngStarAc1(): boolean;
    function getEngineCount(): number;
    function getEngineEGT(_engineIndex: number): number;
    function getEngineAntiIce(_engineIndex: number): boolean;
    function getEngineActive(_engineIndex: number): boolean;
    function getEngineThrottle(_engineIndex: number): number;
    function getEngineThrottleMode(_engineIndex: number): ThrottleMode;
    function getEngineCommandedN1(_engineIndex: number): number;
    function getN2Value(_engineIndex: number): number;
    function getFuelValveOpen(_engineIndex: number): boolean;
    function getEngineThrottleCommandedN1(_engineIndex: number, inverseIfReverseMode?: boolean): number;
    function getTurbEngineReverseNozzlePercent(_engineIndex: number): number;
    function getEngineThrottleMaxThrust(_engineIndex: number): number;
    function getEngineThrustTakeOffMode(_engineIndex: number): number;
    function getEngineThrustClimbMode(_engineIndex: number): number;
    function getAutopilotThrottle(_engineIndex: number): number;
    function getAutopilotCommandedN1(_engineIndex: number): number;
    function getEngineType(): number;
    function getEngineUsePropRPM(): boolean;
    function getEngineRPMJet(_engineIndex: number): number;
    function getEngineRPMJetPC(_engineIndex: number): number;
    function getEngineRPMProp(_engineIndex: number): number;
    function getEngineRPMGen(_engineIndex: number): number;
    function getEngineRPM(_engineIndex: number): number;
    function getEngineMaxHP(): number;
    function getEngineTurbTorque(_engineIndex: number): number;
    function getEngineJetTorque(_engineIndex: number): number;
    function getEngineTorque(_engineIndex: number): number;
    function getEnginePistonTorque(_engineIndex: number): number;
    function getEnginePower(_engineIndex: number): number;
    function getMinCruiseRPM(): number;
    function getMaxCruiseRPM(): number;
    function getMaxIndicatedRPM(): number;
    function getMaxRatedRPM(): number;
    function getPropellerType(): PropellerType;
    function getNbPropellers(): number;
    function getInclinometer(): number;
    function getAngleOfAttack(_unit?: string): number;
    function getOrientationAxis(): XYZ;
    function getAltitude(): number;
    function getGroundReference(): number;
    function getTurnRate(): number;
    function getHeadingMagnetic(): number;
    function getHeadingTrue(): number;
    function getHeadingTrueRadians(): number;
    function getPitch(): number;
    function getBank(): number;
    function getFlightDirectorPitch(): number;
    function getFlightDirectorBank(): number;
    function getIsGrounded(): boolean;
    function getAltitudeAboveGround_(): number;
    function getAltitudeAboveGround(forceSimVarCall?: boolean): number;
    function getCrossoverAltitude(_cas: number, _mach: number): number;
    function getThrustReductionAltitude(): number;
    function getMinimumReferenceMode(): MinimumReferenceMode;
    function getComActFreq(Index: number): number;
    function getComActFreq1(): number;
    function getComSbyFreq(Index: number): number;
    function getComSbyFreq1(): number;
    function getNavHasNav(Index: number): boolean;
    function getNavActFreq(Index: number): number;
    function getNavActFreq1(): number;
    function getNavSbyFreq1(): number;
    function getFlapsNbHandles(): number;
    function getFlapsHandlePercent(): number;
    function getFlapsHandleAngle(_flapIndex: number): number;
    function getFlapsAngle(): number;
    function getFlapsPercent(): number;
    function getSlatsAngle(): number;
    function getSlatsPercent(): number;
    function hasTrim(): boolean;
    function getTrimPos(): number;
    function getRudTrimPos(): number;
    function getTrim(): number;
    function getTrimIndicator(): number;
    function getTrimNeutral(): number;
    function setTransponderToRegion(_index?: number): void;
    function getXPnderCode(): number;
    function setXPnderCode(val: number): void;
    function setTransponderToZero(): void;
    function getTransponderCode1(): number;
    function getTotalAirTemperature(): number;
    function getAmbientTemperature(): number;
    function getFlexTemperature(): number;
    function getElecMainBusVolt(): number;
    function getElecMasterBatt(): boolean;
    function getElecBatBusAmp(): number;
    function getEngGenSw1(): boolean;
    function getExitOpen(): number;
    function getParkBrake(): boolean;
    function getStallWarning(): boolean;
    function getEngOilTemp1(): number;
    function getEngOilTemp(Index: number): number;
    function getWOilPressure(): boolean;
    function getEngOilQuant(Index: number): number;
    function getEngVibration(Index: number): number;
    function getEngOilPressure(Index: number): number;
    function getEngOilPressure1(): number;
    function getEngITT(): number;
    function getFuelWPG(): number;
    function getEngFuelPressure(Index: number): number;
    function getEngFuelPressure0(): number;
    function getEngFuelFlow(Index: number): number;
    function getEngFuelFlow1(): number;
    function getEngFuelLineFlow(index: number): number;
    function getEngFuelValveSwitch(index: number): boolean;
    function getEngFuelValveOpen(index: number): number;
    function getEngFuelPumpActive(index: number): boolean;
    function getEngFuelPumpSwitch(index: number): boolean;
    function getEngFuelTankQuantity(index: number): number;
    function getEngFuelPump1(): boolean;
    function getFuelPress(): number;
    function getTankSelector(): number;
    function getFuelQuantityR(): number;
    function getFuelQuantityL(): number;
    function getFuelMQuantityL(): number;
    function getFuelMQuantityR(): number;
    function getFuelCapacity(): number;
    function getFuelcQuantity(): number;
    function getFuelPercent(): number;
    function getFuelQuantity(): number;
    function getTotalFuel(): number;
    function getFuelUsed(_engineIndex: number): number;
    function getCompassAngle(): number;
    function getPressureValue(_units?: string): number;
    function getBaroSele(): boolean;
    function getPressureSelectedUnits(): string;
    function getBaroMode(): number;
    function getBaroFStd(): boolean;
    function getPressureSelectedMode(_aircraft: Aircraft): string;
    function getHasGlassCockpit(): boolean;
    function getPressurisationCabinAltitude(): number;
    function getPressurisationCabinAltitudeGoal(): number;
    function getPressurisationCabinAltitudeRate(): number;
    function getPressurisationDifferential(): number;
    function getBleedAirSourceCont(): number;
    function getPartpanVacu(): number;
    function getWeight(): number;
    function getMaxWeight(): number;
    function getGForce(): number;
    function getIsGearRetractable(): boolean;
    function getGearHandlePosition(): boolean;
    function getGearPosition(): number;
    function getUnitIsMetric(): boolean;
    function getLatSpeed(): number;
    function getGroundVelocity(): number;
    function convertTrackToHeading(track: number, trueGroundSpeed?: number, lateralVelocity?: number): number;
    function convertFPAToVS(fpa: number, trueAirspeed?: number): number;
    function getRadioNavAct(): boolean;
    function setRadioNavAct(val: boolean): void;
    function getCurrentPage(): number;
    function setCurrentPage(val: number): void;
    function getCurrentFlightPhase(forceSimVarCall?: boolean): number;
    function setCurrentFlightPhase(val: number): void;
    function getCurrentLat(): number;
    function getCurrentLon(): number;
    function getWorldRegion(): WorldRegion;
}
