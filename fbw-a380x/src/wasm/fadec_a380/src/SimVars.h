#pragma once

/// <summary>
/// SimConnect data types to send to Sim Updated
/// </summary>
enum DataTypesID {
  PayloadStation1,
  PayloadStation2,
  PayloadStation3,
  PayloadStation4,
  PayloadStation5,
  PayloadStation6,
  PayloadStation7,
  PayloadStation8,
  FuelSystemLeftOuter,
  FuelSystemFeedOne,
  FuelSystemLeftMid,
  FuelSystemLeftInner,
  FuelSystemFeedTwo,
  FuelSystemFeedThree,
  FuelSystemRightInner,
  FuelSystemRightMid,
  FuelSystemFeedFour,
  FuelSystemRightOuter,
  FuelSystemTrim,
  OilTempEngine1,
  OilTempEngine2,
  OilTempEngine3,
  OilTempEngine4,
  OilPsiEngine1,
  OilPsiEngine2,
  OilPsiEngine3,
  OilPsiEngine4,
  StartCN3Engine1,
  StartCN3Engine2,
  StartCN3Engine3,
  StartCN3Engine4,
  SimulationDataTypeId,
  AcftInfo,
};

struct SimulationData {
  double simulationTime;
  double simulationRate;
};

struct SimulationDataLivery {
  char atc_id[32] = "";
};

/// <summary>
/// A collection of SimVar unit enums.
/// </summary>
class Units {
 public:
  ENUM Percent = get_units_enum("Percent");
  ENUM Pounds = get_units_enum("Pounds");
  ENUM Psi = get_units_enum("Psi");
  ENUM Pph = get_units_enum("Pounds per hour");
  ENUM Gallons = get_units_enum("Gallons");
  ENUM Feet = get_units_enum("Feet");
  ENUM FootPounds = get_units_enum("Foot pounds");
  ENUM FeetMin = get_units_enum("Feet per minute");
  ENUM Number = get_units_enum("Number");
  ENUM Mach = get_units_enum("Mach");
  ENUM Millibars = get_units_enum("Millibars");
  ENUM SluggerSlugs = get_units_enum("Slug per cubic feet");
  ENUM Celsius = get_units_enum("Celsius");
  ENUM Bool = get_units_enum("Bool");
  ENUM Hours = get_units_enum("Hours");
  ENUM Seconds = get_units_enum("Seconds");
};

/// <summary>
/// A collection of SimVars and LVars for the A32NX
/// </summary>
class SimVars {
 public:
  Units* m_Units;

  /// <summary>
  /// Collection of SimVars for the A32NX
  /// </summary>
  ENUM CorrectedN1 = get_aircraft_var_enum("TURB ENG CORRECTED N1");
  ENUM CorrectedN2 = get_aircraft_var_enum("TURB ENG CORRECTED N2");
  ENUM N1 = get_aircraft_var_enum("TURB ENG N1");
  ENUM N2 = get_aircraft_var_enum("TURB ENG N2");
  ENUM OilPSI = get_aircraft_var_enum("GENERAL ENG OIL PRESSURE");
  ENUM OilTemp = get_aircraft_var_enum("GENERAL ENG OIL TEMPERATURE");
  ENUM Thrust = get_aircraft_var_enum("TURB ENG JET THRUST");
  ENUM correctedFF = get_aircraft_var_enum("TURB ENG CORRECTED FF");
  ENUM PlaneAltitude = get_aircraft_var_enum("PLANE ALTITUDE");
  ENUM PlaneAltitudeAGL = get_aircraft_var_enum("PLANE ALT ABOVE GROUND");
  ENUM PressureAltitude = get_aircraft_var_enum("PRESSURE ALTITUDE");
  ENUM AirSpeedMach = get_aircraft_var_enum("AIRSPEED MACH");
  ENUM AmbientTemp = get_aircraft_var_enum("AMBIENT TEMPERATURE");
  ENUM AmbientPressure = get_aircraft_var_enum("AMBIENT PRESSURE");
  ENUM VerticalSpeed = get_aircraft_var_enum("VERTICAL SPEED");
  ENUM StdTemp = get_aircraft_var_enum("STANDARD ATM TEMPERATURE");
  ENUM SimOnGround = get_aircraft_var_enum("SIM ON GROUND");
  ENUM EngineTime = get_aircraft_var_enum("GENERAL ENG ELAPSED TIME");
  ENUM EngineStarter = get_aircraft_var_enum("GENERAL ENG STARTER");
  ENUM EngineIgniter = get_aircraft_var_enum("TURB ENG IGNITION SWITCH EX1");
  ENUM EngineCombustion = get_aircraft_var_enum("GENERAL ENG COMBUSTION");
  ENUM animDeltaTime = get_aircraft_var_enum("ANIMATION DELTA TIME");

  ENUM TankFuelQuantity = get_aircraft_var_enum("FUELSYSTEM TANK QUANTITY");
  ENUM FuelTotalQuantity = get_aircraft_var_enum("FUEL TOTAL QUANTITY");

  ENUM EmptyWeight = get_aircraft_var_enum("EMPTY WEIGHT");
  ENUM TotalWeight = get_aircraft_var_enum("TOTAL WEIGHT");
  ENUM FuelWeightGallon = get_aircraft_var_enum("FUEL WEIGHT PER GALLON");

  ENUM NacelleAntiIce = get_aircraft_var_enum("ENG ANTI ICE");

  ENUM PayloadStationWeights = get_aircraft_var_enum("PAYLOAD STATION WEIGHT");

  /// <summary>
  /// Collection of LVars for the A32NX
  /// </summary>
  ID DevVar;
  ID IsReady;
  ID FlexTemp;
  ID Engine1N3;
  ID Engine2N3;
  ID Engine3N3;
  ID Engine4N3;
  ID Engine1N2;
  ID Engine2N2;
  ID Engine3N2;
  ID Engine4N2;
  ID Engine1N1;
  ID Engine2N1;
  ID Engine3N1;
  ID Engine4N1;
  ID EngineIdleN1;
  ID EngineIdleN3;
  ID EngineIdleFF;
  ID EngineIdleEGT;
  ID Engine1EGT;
  ID Engine2EGT;
  ID Engine3EGT;
  ID Engine4EGT;
  ID Engine1Oil;
  ID Engine2Oil;
  ID Engine3Oil;
  ID Engine4Oil;
  ID Engine1TotalOil;
  ID Engine2TotalOil;
  ID Engine3TotalOil;
  ID Engine4TotalOil;
  ID Engine1FF;
  ID Engine2FF;
  ID Engine3FF;
  ID Engine4FF;
  ID Engine1PreFF;
  ID Engine2PreFF;
  ID Engine3PreFF;
  ID Engine4PreFF;
  ID EngineCycleTime;
  ID EngineImbalance;
  ID WingAntiIce;
  ID FuelUsedEngine1;
  ID FuelUsedEngine2;
  ID FuelUsedEngine3;
  ID FuelUsedEngine4;

  ID FuelLeftOuterPre;
  ID FuelFeedOnePre;
  ID FuelLeftMidPre;
  ID FuelLeftInnerPre;
  ID FuelFeedTwoPre;
  ID FuelFeedThreePre;
  ID FuelRightInnerPre;
  ID FuelRightMidPre;
  ID FuelFeedFourPre;
  ID FuelRightOuterPre;
  ID FuelTrimPre;

  ID RefuelRate;
  ID RefuelStartedByUser;
  ID FuelOverflowLeft;
  ID FuelOverflowRight;
  ID Engine1State;
  ID Engine2State;
  ID Engine3State;
  ID Engine4State;
  ID Engine1Timer;
  ID Engine2Timer;
  ID Engine3Timer;
  ID Engine4Timer;
  ID PumpStateEngine1;
  ID PumpStateEngine2;
  ID PumpStateEngine3;
  ID PumpStateEngine4;
  ID PerPaxWeight;
  ID ThrustLimitType;
  ID ThrustLimitIdle;
  ID ThrustLimitToga;
  ID ThrustLimitFlex;
  ID ThrustLimitClimb;
  ID ThrustLimitMct;
  ID PacksState1;
  ID PacksState2;

  SimVars() { this->initializeVars(); }

  void initializeVars() {
    DevVar = register_named_variable("A32NX_DEVELOPER_STATE");
    IsReady = register_named_variable("A32NX_IS_READY");
    FlexTemp = register_named_variable("AIRLINER_TO_FLEX_TEMP");
    Engine1N3 = register_named_variable("A32NX_ENGINE_N3:1");
    Engine2N3 = register_named_variable("A32NX_ENGINE_N3:2");
    Engine3N3 = register_named_variable("A32NX_ENGINE_N3:3");
    Engine4N3 = register_named_variable("A32NX_ENGINE_N3:4");
    Engine1N2 = register_named_variable("A32NX_ENGINE_N2:1");
    Engine2N2 = register_named_variable("A32NX_ENGINE_N2:2");
    Engine3N2 = register_named_variable("A32NX_ENGINE_N2:3");
    Engine4N2 = register_named_variable("A32NX_ENGINE_N2:4");
    Engine1N1 = register_named_variable("A32NX_ENGINE_N1:1");
    Engine2N1 = register_named_variable("A32NX_ENGINE_N1:2");
    Engine3N1 = register_named_variable("A32NX_ENGINE_N1:3");
    Engine4N1 = register_named_variable("A32NX_ENGINE_N1:4");
    EngineIdleN1 = register_named_variable("A32NX_ENGINE_IDLE_N1");
    EngineIdleN3 = register_named_variable("A32NX_ENGINE_IDLE_N3");
    EngineIdleFF = register_named_variable("A32NX_ENGINE_IDLE_FF");
    EngineIdleEGT = register_named_variable("A32NX_ENGINE_IDLE_EGT");
    Engine1EGT = register_named_variable("A32NX_ENGINE_EGT:1");
    Engine2EGT = register_named_variable("A32NX_ENGINE_EGT:2");
    Engine3EGT = register_named_variable("A32NX_ENGINE_EGT:3");
    Engine4EGT = register_named_variable("A32NX_ENGINE_EGT:4");
    Engine1Oil = register_named_variable("A32NX_ENGINE_TANK_OIL:1");
    Engine2Oil = register_named_variable("A32NX_ENGINE_TANK_OIL:2");
    Engine3Oil = register_named_variable("A32NX_ENGINE_TANK_OIL:3");
    Engine4Oil = register_named_variable("A32NX_ENGINE_TANK_OIL:4");
    Engine1TotalOil = register_named_variable("A32NX_ENGINE_TOTAL_OIL:1");
    Engine2TotalOil = register_named_variable("A32NX_ENGINE_TOTAL_OIL:2");
    Engine3TotalOil = register_named_variable("A32NX_ENGINE_TOTAL_OIL:3");
    Engine4TotalOil = register_named_variable("A32NX_ENGINE_TOTAL_OIL:4");
    Engine1FF = register_named_variable("A32NX_ENGINE_FF:1");
    Engine2FF = register_named_variable("A32NX_ENGINE_FF:2");
    Engine3FF = register_named_variable("A32NX_ENGINE_FF:3");
    Engine4FF = register_named_variable("A32NX_ENGINE_FF:4");
    Engine1PreFF = register_named_variable("A32NX_ENGINE_PRE_FF:1");
    Engine2PreFF = register_named_variable("A32NX_ENGINE_PRE_FF:2");
    Engine3PreFF = register_named_variable("A32NX_ENGINE_PRE_FF:3");
    Engine4PreFF = register_named_variable("A32NX_ENGINE_PRE_FF:4");
    EngineImbalance = register_named_variable("A32NX_ENGINE_IMBALANCE");
	WingAntiIce = register_named_variable("A32NX_PNEU_WING_ANTI_ICE_SYSTEM_ON");
    FuelUsedEngine1 = register_named_variable("A32NX_FUEL_USED:1");
    FuelUsedEngine2 = register_named_variable("A32NX_FUEL_USED:2");
    FuelUsedEngine3 = register_named_variable("A32NX_FUEL_USED:3");
    FuelUsedEngine4 = register_named_variable("A32NX_FUEL_USED:4");

    FuelLeftOuterPre = register_named_variable("A32NX_FUEL_LEFTOUTER_PRE");
    FuelFeedOnePre = register_named_variable("A32NX_FUEL_FEED1_PRE");
    FuelLeftMidPre = register_named_variable("A32NX_FUEL_LEFTMID_PRE");
    FuelLeftInnerPre = register_named_variable("A32NX_FUEL_LEFTINNER_PRE");
    FuelFeedTwoPre = register_named_variable("A32NX_FUEL_FEED2_PRE");
    FuelFeedThreePre = register_named_variable("A32NX_FUEL_FEED3_PRE");
    FuelRightInnerPre = register_named_variable("A32NX_FUEL_RIGHTINNER_PRE");
    FuelRightMidPre = register_named_variable("A32NX_FUEL_RIGHTMID_PRE");
    FuelFeedFourPre = register_named_variable("A32NX_FUEL_FEED4_PRE");
    FuelRightOuterPre = register_named_variable("A32NX_FUEL_RIGHTOUTER_PRE");
    FuelTrimPre = register_named_variable("A32NX_FUEL_TRIM_PRE");

    RefuelRate = register_named_variable("A32NX_EFB_REFUEL_RATE_SETTING");
    RefuelStartedByUser = register_named_variable("A32NX_REFUEL_STARTED_BY_USR");
    Engine1State = register_named_variable("A32NX_ENGINE_STATE:1");
    Engine2State = register_named_variable("A32NX_ENGINE_STATE:2");
    Engine3State = register_named_variable("A32NX_ENGINE_STATE:3");
    Engine4State = register_named_variable("A32NX_ENGINE_STATE:4");
    Engine1Timer = register_named_variable("A32NX_ENGINE_TIMER:1");
    Engine2Timer = register_named_variable("A32NX_ENGINE_TIMER:2");
    Engine3Timer = register_named_variable("A32NX_ENGINE_TIMER:3");
    Engine4Timer = register_named_variable("A32NX_ENGINE_TIMER:4");
    PumpStateEngine1 = register_named_variable("A32NX_PUMP_STATE:1");
    PumpStateEngine2 = register_named_variable("A32NX_PUMP_STATE:2");
    PumpStateEngine3 = register_named_variable("A32NX_PUMP_STATE:3");
    PumpStateEngine4 = register_named_variable("A32NX_PUMP_STATE:4");

    ThrustLimitType = register_named_variable("A32NX_AUTOTHRUST_THRUST_LIMIT_TYPE");
    ThrustLimitIdle = register_named_variable("A32NX_AUTOTHRUST_THRUST_LIMIT_IDLE");
    ThrustLimitToga = register_named_variable("A32NX_AUTOTHRUST_THRUST_LIMIT_TOGA");
    ThrustLimitFlex = register_named_variable("A32NX_AUTOTHRUST_THRUST_LIMIT_FLX");
    ThrustLimitClimb = register_named_variable("A32NX_AUTOTHRUST_THRUST_LIMIT_CLB");
    ThrustLimitMct = register_named_variable("A32NX_AUTOTHRUST_THRUST_LIMIT_MCT");

    PacksState1 = register_named_variable("A32NX_COND_PACK_FLOW_VALVE_1_IS_OPEN");
    PacksState2 = register_named_variable("A32NX_COND_PACK_FLOW_VALVE_2_IS_OPEN");

    this->setDeveloperState(0);
    this->setEngine1N3(0);
    this->setEngine2N3(0);
    this->setEngine3N3(0);
    this->setEngine4N3(0);
    this->setEngine1N2(0);
    this->setEngine2N2(0);
    this->setEngine3N2(0);
    this->setEngine4N2(0);
    this->setEngine1N1(0);
    this->setEngine2N1(0);
    this->setEngine3N1(0);
    this->setEngine4N1(0);
    this->setEngineIdleN1(0);
    this->setEngineIdleN3(0);
    this->setEngineIdleFF(0);
    this->setEngineIdleEGT(0);
    this->setEngine1EGT(0);
    this->setEngine2EGT(0);
    this->setEngine3EGT(0);
    this->setEngine4EGT(0);
    this->setEngine1Oil(0);
    this->setEngine2Oil(0);
    this->setEngine3Oil(0);
    this->setEngine4Oil(0);
    this->setEngine1TotalOil(0);
    this->setEngine2TotalOil(0);
    this->setEngine3TotalOil(0);
    this->setEngine4TotalOil(0);
    this->setEngine1FF(0);
    this->setEngine2FF(0);
    this->setEngine3FF(0);
    this->setEngine4FF(0);
    this->setEngine1PreFF(0);
    this->setEngine2PreFF(0);
    this->setEngine3PreFF(0);
    this->setEngine4PreFF(0);
    this->setEngineImbalance(0);
    this->setFuelUsedEngine1(0);
    this->setFuelUsedEngine2(0);
    this->setFuelUsedEngine3(0);
    this->setFuelUsedEngine4(0);
    this->setFuelLeftOuterPre(0);
    this->setFuelFeedOnePre(0);
    this->setFuelLeftMidPre(0);
    this->setFuelLeftInnerPre(0);
    this->setFuelFeedTwoPre(0);
    this->setFuelFeedThreePre(0);
    this->setFuelRightInnerPre(0);
    this->setFuelRightMidPre(0);
    this->setFuelFeedFourPre(0);
    this->setFuelRightOuterPre(0);
    this->setFuelTrimPre(0);
    this->setEngine1State(0);
    this->setEngine2State(0);
    this->setEngine3State(0);
    this->setEngine4State(0);
    this->setEngine1Timer(0);
    this->setEngine2Timer(0);
    this->setEngine3Timer(0);
    this->setEngine4Timer(0);
    this->setPumpStateEngine1(0);
    this->setPumpStateEngine2(0);
    this->setPumpStateEngine3(0);
    this->setPumpStateEngine4(0);
    this->setThrustLimitIdle(0);
    this->setThrustLimitToga(0);
    this->setThrustLimitFlex(0);
    this->setThrustLimitClimb(0);
    this->setThrustLimitMct(0);

    m_Units = new Units();
  }

  // Collection of LVar 'set' Functions
  void setDeveloperState(FLOAT64 value) { set_named_variable_value(DevVar, value); }
  void setEngine1N3(FLOAT64 value) { set_named_variable_value(Engine1N3, value); }
  void setEngine2N3(FLOAT64 value) { set_named_variable_value(Engine2N3, value); }
  void setEngine3N3(FLOAT64 value) { set_named_variable_value(Engine3N3, value); }
  void setEngine4N3(FLOAT64 value) { set_named_variable_value(Engine4N3, value); }
  void setEngine1N2(FLOAT64 value) { set_named_variable_value(Engine1N2, value); }
  void setEngine2N2(FLOAT64 value) { set_named_variable_value(Engine2N2, value); }
  void setEngine3N2(FLOAT64 value) { set_named_variable_value(Engine3N2, value); }
  void setEngine4N2(FLOAT64 value) { set_named_variable_value(Engine4N2, value); }
  void setEngine1N1(FLOAT64 value) { set_named_variable_value(Engine1N1, value); }
  void setEngine2N1(FLOAT64 value) { set_named_variable_value(Engine2N1, value); }
  void setEngine3N1(FLOAT64 value) { set_named_variable_value(Engine3N1, value); }
  void setEngine4N1(FLOAT64 value) { set_named_variable_value(Engine4N1, value); }
  void setEngineIdleN1(FLOAT64 value) { set_named_variable_value(EngineIdleN1, value); }
  void setEngineIdleN3(FLOAT64 value) { set_named_variable_value(EngineIdleN3, value); }
  void setEngineIdleFF(FLOAT64 value) { set_named_variable_value(EngineIdleFF, value); }
  void setEngineIdleEGT(FLOAT64 value) { set_named_variable_value(EngineIdleEGT, value); }
  void setEngine1EGT(FLOAT64 value) { set_named_variable_value(Engine1EGT, value); }
  void setEngine2EGT(FLOAT64 value) { set_named_variable_value(Engine2EGT, value); }
  void setEngine3EGT(FLOAT64 value) { set_named_variable_value(Engine3EGT, value); }
  void setEngine4EGT(FLOAT64 value) { set_named_variable_value(Engine4EGT, value); }
  void setEngine1Oil(FLOAT64 value) { set_named_variable_value(Engine1Oil, value); }
  void setEngine2Oil(FLOAT64 value) { set_named_variable_value(Engine2Oil, value); }
  void setEngine3Oil(FLOAT64 value) { set_named_variable_value(Engine3Oil, value); }
  void setEngine4Oil(FLOAT64 value) { set_named_variable_value(Engine4Oil, value); }
  void setEngine1TotalOil(FLOAT64 value) { set_named_variable_value(Engine1TotalOil, value); }
  void setEngine2TotalOil(FLOAT64 value) { set_named_variable_value(Engine2TotalOil, value); }
  void setEngine3TotalOil(FLOAT64 value) { set_named_variable_value(Engine3TotalOil, value); }
  void setEngine4TotalOil(FLOAT64 value) { set_named_variable_value(Engine4TotalOil, value); }
  void setEngine1FF(FLOAT64 value) { set_named_variable_value(Engine1FF, value); }
  void setEngine2FF(FLOAT64 value) { set_named_variable_value(Engine2FF, value); }
  void setEngine3FF(FLOAT64 value) { set_named_variable_value(Engine3FF, value); }
  void setEngine4FF(FLOAT64 value) { set_named_variable_value(Engine4FF, value); }
  void setEngine1PreFF(FLOAT64 value) { set_named_variable_value(Engine1PreFF, value); }
  void setEngine2PreFF(FLOAT64 value) { set_named_variable_value(Engine2PreFF, value); }
  void setEngine3PreFF(FLOAT64 value) { set_named_variable_value(Engine3PreFF, value); }
  void setEngine4PreFF(FLOAT64 value) { set_named_variable_value(Engine4PreFF, value); }
  void setEngineImbalance(FLOAT64 value) { set_named_variable_value(EngineImbalance, value); }
  void setFuelUsedEngine1(FLOAT64 value) { set_named_variable_value(FuelUsedEngine1, value); }
  void setFuelUsedEngine2(FLOAT64 value) { set_named_variable_value(FuelUsedEngine2, value); }
  void setFuelUsedEngine3(FLOAT64 value) { set_named_variable_value(FuelUsedEngine3, value); }
  void setFuelUsedEngine4(FLOAT64 value) { set_named_variable_value(FuelUsedEngine4, value); }

  void setFuelLeftOuterPre(FLOAT64 value) { set_named_variable_value(FuelLeftOuterPre, value); };
  void setFuelFeedOnePre(FLOAT64 value) { set_named_variable_value(FuelFeedOnePre, value); };
  void setFuelLeftMidPre(FLOAT64 value) { set_named_variable_value(FuelLeftMidPre, value); };
  void setFuelLeftInnerPre(FLOAT64 value) { set_named_variable_value(FuelLeftInnerPre, value); };
  void setFuelFeedTwoPre(FLOAT64 value) { set_named_variable_value(FuelFeedTwoPre, value); };
  void setFuelFeedThreePre(FLOAT64 value) { set_named_variable_value(FuelFeedThreePre, value); };
  void setFuelRightInnerPre(FLOAT64 value) { set_named_variable_value(FuelRightInnerPre, value); };
  void setFuelRightMidPre(FLOAT64 value) { set_named_variable_value(FuelRightMidPre, value); };
  void setFuelFeedFourPre(FLOAT64 value) { set_named_variable_value(FuelFeedFourPre, value); };
  void setFuelRightOuterPre(FLOAT64 value) { set_named_variable_value(FuelRightOuterPre, value); };
  void setFuelTrimPre(FLOAT64 value) { set_named_variable_value(FuelTrimPre, value); };

  void setEngine1State(FLOAT64 value) { set_named_variable_value(Engine1State, value); }
  void setEngine2State(FLOAT64 value) { set_named_variable_value(Engine2State, value); }
  void setEngine3State(FLOAT64 value) { set_named_variable_value(Engine3State, value); }
  void setEngine4State(FLOAT64 value) { set_named_variable_value(Engine4State, value); }
  void setEngine1Timer(FLOAT64 value) { set_named_variable_value(Engine1Timer, value); }
  void setEngine2Timer(FLOAT64 value) { set_named_variable_value(Engine2Timer, value); }
  void setEngine3Timer(FLOAT64 value) { set_named_variable_value(Engine3Timer, value); }
  void setEngine4Timer(FLOAT64 value) { set_named_variable_value(Engine4Timer, value); }
  void setPumpStateEngine1(FLOAT64 value) { set_named_variable_value(PumpStateEngine1, value); }
  void setPumpStateEngine2(FLOAT64 value) { set_named_variable_value(PumpStateEngine2, value); }
  void setPumpStateEngine3(FLOAT64 value) { set_named_variable_value(PumpStateEngine3, value); }
  void setPumpStateEngine4(FLOAT64 value) { set_named_variable_value(PumpStateEngine4, value); }
  void setThrustLimitIdle(FLOAT64 value) { set_named_variable_value(ThrustLimitIdle, value); }
  void setThrustLimitToga(FLOAT64 value) { set_named_variable_value(ThrustLimitToga, value); }
  void setThrustLimitFlex(FLOAT64 value) { set_named_variable_value(ThrustLimitFlex, value); }
  void setThrustLimitClimb(FLOAT64 value) { set_named_variable_value(ThrustLimitClimb, value); }
  void setThrustLimitMct(FLOAT64 value) { set_named_variable_value(ThrustLimitMct, value); }

  // Collection of SimVar/LVar 'get' Functions
  FLOAT64 getDeveloperState() { return get_named_variable_value(DevVar); }
  FLOAT64 getIsReady() { return get_named_variable_value(IsReady); }
  FLOAT64 getFlexTemp() { return get_named_variable_value(FlexTemp); }
  FLOAT64 getEngine1N3() { return get_named_variable_value(Engine1N3); }
  FLOAT64 getEngine2N3() { return get_named_variable_value(Engine2N3); }
  FLOAT64 getEngine3N3() { return get_named_variable_value(Engine3N3); }
  FLOAT64 getEngine4N3() { return get_named_variable_value(Engine4N3); }
  FLOAT64 getEngine1N2() { return get_named_variable_value(Engine1N2); }
  FLOAT64 getEngine2N2() { return get_named_variable_value(Engine2N2); }
  FLOAT64 getEngine3N2() { return get_named_variable_value(Engine3N2); }
  FLOAT64 getEngine4N2() { return get_named_variable_value(Engine4N2); }
  FLOAT64 getEngine1N1() { return get_named_variable_value(Engine1N1); }
  FLOAT64 getEngine2N1() { return get_named_variable_value(Engine2N1); }
  FLOAT64 getEngine3N1() { return get_named_variable_value(Engine3N1); }
  FLOAT64 getEngine4N1() { return get_named_variable_value(Engine4N1); }
  FLOAT64 getEngineIdleN1() { return get_named_variable_value(EngineIdleN1); }
  FLOAT64 getEngineIdleN3() { return get_named_variable_value(EngineIdleN3); }
  FLOAT64 getEngineIdleFF() { return get_named_variable_value(EngineIdleFF); }
  FLOAT64 getEngineIdleEGT() { return get_named_variable_value(EngineIdleEGT); }
  FLOAT64 getEngine1FF() { return get_named_variable_value(Engine1FF); }
  FLOAT64 getEngine2FF() { return get_named_variable_value(Engine2FF); }
  FLOAT64 getEngine3FF() { return get_named_variable_value(Engine3FF); }
  FLOAT64 getEngine4FF() { return get_named_variable_value(Engine4FF); }
  FLOAT64 getEngine1EGT() { return get_named_variable_value(Engine1EGT); }
  FLOAT64 getEngine2EGT() { return get_named_variable_value(Engine2EGT); }
  FLOAT64 getEngine3EGT() { return get_named_variable_value(Engine3EGT); }
  FLOAT64 getEngine4EGT() { return get_named_variable_value(Engine4EGT); }
  FLOAT64 getEngine1Oil() { return get_named_variable_value(Engine1Oil); }
  FLOAT64 getEngine2Oil() { return get_named_variable_value(Engine2Oil); }
  FLOAT64 getEngine3Oil() { return get_named_variable_value(Engine3Oil); }
  FLOAT64 getEngine4Oil() { return get_named_variable_value(Engine4Oil); }
  FLOAT64 getEngine1TotalOil() { return get_named_variable_value(Engine1TotalOil); }
  FLOAT64 getEngine2TotalOil() { return get_named_variable_value(Engine2TotalOil); }
  FLOAT64 getEngine3TotalOil() { return get_named_variable_value(Engine3TotalOil); }
  FLOAT64 getEngine4TotalOil() { return get_named_variable_value(Engine4TotalOil); }
  FLOAT64 getEngine1PreFF() { return get_named_variable_value(Engine1PreFF); }
  FLOAT64 getEngine2PreFF() { return get_named_variable_value(Engine2PreFF); }
  FLOAT64 getEngine3PreFF() { return get_named_variable_value(Engine3PreFF); }
  FLOAT64 getEngine4PreFF() { return get_named_variable_value(Engine4PreFF); }
  FLOAT64 getEngineImbalance() { return get_named_variable_value(EngineImbalance); }
  FLOAT64 getWAI() { return get_named_variable_value(WingAntiIce); }
  FLOAT64 getFuelUsedEngine1() { return get_named_variable_value(FuelUsedEngine1); }
  FLOAT64 getFuelUsedEngine2() { return get_named_variable_value(FuelUsedEngine2); }
  FLOAT64 getFuelUsedEngine3() { return get_named_variable_value(FuelUsedEngine3); }
  FLOAT64 getFuelUsedEngine4() { return get_named_variable_value(FuelUsedEngine4); }

  FLOAT64 getFuelLeftOuterPre() { return get_named_variable_value(FuelLeftOuterPre); }
  FLOAT64 getFuelFeedOnePre() { return get_named_variable_value(FuelFeedOnePre); }
  FLOAT64 getFuelLeftMidPre() { return get_named_variable_value(FuelLeftMidPre); }
  FLOAT64 getFuelLeftInnerPre() { return get_named_variable_value(FuelLeftInnerPre); }
  FLOAT64 getFuelFeedTwoPre() { return get_named_variable_value(FuelFeedTwoPre); }
  FLOAT64 getFuelFeedThreePre() { return get_named_variable_value(FuelFeedThreePre); }
  FLOAT64 getFuelRightInnerPre() { return get_named_variable_value(FuelRightInnerPre); }
  FLOAT64 getFuelRightMidPre() { return get_named_variable_value(FuelRightMidPre); }
  FLOAT64 getFuelFeedFourPre() { return get_named_variable_value(FuelFeedFourPre); }
  FLOAT64 getFuelRightOuterPre() { return get_named_variable_value(FuelRightOuterPre); }
  FLOAT64 getFuelTrimPre() { return get_named_variable_value(FuelTrimPre); }

  FLOAT64 getRefuelRate() { return get_named_variable_value(RefuelRate); }
  FLOAT64 getRefuelStartedByUser() { return get_named_variable_value(RefuelStartedByUser); }
  FLOAT64 getPumpStateEngine1() { return get_named_variable_value(PumpStateEngine1); }
  FLOAT64 getPumpStateEngine2() { return get_named_variable_value(PumpStateEngine2); }
  FLOAT64 getPumpStateEngine3() { return get_named_variable_value(PumpStateEngine3); }
  FLOAT64 getPumpStateEngine4() { return get_named_variable_value(PumpStateEngine4); }
  FLOAT64 getPacksState1() { return get_named_variable_value(PacksState1); }
  FLOAT64 getPacksState2() { return get_named_variable_value(PacksState2); }
  FLOAT64 getThrustLimitType() { return get_named_variable_value(ThrustLimitType); }

  FLOAT64 getCN1(int index) { return aircraft_varget(CorrectedN1, m_Units->Percent, index); }
  FLOAT64 getCN2(int index) { return aircraft_varget(CorrectedN2, m_Units->Percent, index); }
  FLOAT64 getN1(int index) { return aircraft_varget(N1, m_Units->Percent, index); }
  FLOAT64 getN2(int index) { return aircraft_varget(N2, m_Units->Percent, index); }
  FLOAT64 getOilPsi(int index) { return aircraft_varget(OilPSI, m_Units->Psi, index); }
  FLOAT64 getOilTemp(int index) { return aircraft_varget(OilTemp, m_Units->Celsius, index); }
  FLOAT64 getThrust(int index) { return aircraft_varget(Thrust, m_Units->Pounds, index); }
  FLOAT64 getEngine1State() { return get_named_variable_value(Engine1State); }
  FLOAT64 getEngine2State() { return get_named_variable_value(Engine2State); }
  FLOAT64 getEngine3State() { return get_named_variable_value(Engine3State); }
  FLOAT64 getEngine4State() { return get_named_variable_value(Engine4State); }
  FLOAT64 getEngine1Timer() { return get_named_variable_value(Engine1Timer); }
  FLOAT64 getEngine2Timer() { return get_named_variable_value(Engine2Timer); }
  FLOAT64 getEngine3Timer() { return get_named_variable_value(Engine3Timer); }
  FLOAT64 getEngine4Timer() { return get_named_variable_value(Engine4Timer); }
  FLOAT64 getFF(int index) { return aircraft_varget(correctedFF, m_Units->Pph, index); }
  FLOAT64 getMach() { return aircraft_varget(AirSpeedMach, m_Units->Mach, 0); }
  FLOAT64 getPlaneAltitude() { return aircraft_varget(PlaneAltitude, m_Units->Feet, 0); }
  FLOAT64 getPlaneAltitudeAGL() { return aircraft_varget(PlaneAltitudeAGL, m_Units->Feet, 0); }
  FLOAT64 getPressureAltitude() { return aircraft_varget(PressureAltitude, m_Units->Feet, 0); }
  FLOAT64 getVerticalSpeed() { return aircraft_varget(VerticalSpeed, m_Units->FeetMin, 0); }
  FLOAT64 getAmbientTemperature() { return aircraft_varget(AmbientTemp, m_Units->Celsius, 0); }
  FLOAT64 getAmbientPressure() { return aircraft_varget(AmbientPressure, m_Units->Millibars, 0); }
  FLOAT64 getStdTemperature() { return aircraft_varget(StdTemp, m_Units->Celsius, 0); }
  FLOAT64 getSimOnGround() { return aircraft_varget(SimOnGround, m_Units->Bool, 0); }
  FLOAT64 getFuelTotalQuantity() { return aircraft_varget(FuelTotalQuantity, m_Units->Gallons, 0); }
  FLOAT64 getEmptyWeight() { return aircraft_varget(EmptyWeight, m_Units->Pounds, 0); }
  FLOAT64 getTotalWeight() { return aircraft_varget(TotalWeight, m_Units->Pounds, 0); }
  FLOAT64 getFuelWeightGallon() { return aircraft_varget(FuelWeightGallon, m_Units->Pounds, 0); }
  FLOAT64 getTankFuelQuantity(int index) { return aircraft_varget(TankFuelQuantity, m_Units->Gallons, index); }
  FLOAT64 getEngineTime(int index) { return aircraft_varget(EngineTime, m_Units->Seconds, index); }
  FLOAT64 getEngineStarter(int index) { return aircraft_varget(EngineStarter, m_Units->Bool, index); }
  FLOAT64 getEngineIgniter(int index) { return aircraft_varget(EngineIgniter, m_Units->Number, index); }
  FLOAT64 getEngineCombustion(int index) { return aircraft_varget(EngineCombustion, m_Units->Bool, index); }
  FLOAT64 getAnimDeltaTime() { return aircraft_varget(animDeltaTime, m_Units->Seconds, 0); }
  FLOAT64 getNAI(int index) { return aircraft_varget(NacelleAntiIce, m_Units->Bool, index); }
};
