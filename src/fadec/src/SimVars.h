#pragma once

/// <summary>
/// SimConnect data types to send Sim Updated
/// </summary>
enum DataTypesID {
  FuelLeftMain,
  FuelRightMain,
  FuelCenterMain,
  FuelLeftAux,
  FuelRightAux,
  OilTempLeft,
  OilTempRight,
  OilPsiLeft,
  OilPsiRight,
  StartCN2Left,
  StartCN2Right,
  SimulationDataTypeId,
};

struct SimulationData {
  double simulationTime;
  double simulationRate;
};

enum EventTypesID {
  EVENT_SIM_START,
  EVENT_SIM_STOP,
  EVENT_FLIGHT_LOAD,
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
  ENUM VerticalSpeed = get_aircraft_var_enum("VERTICAL SPEED");
  ENUM StdTemp = get_aircraft_var_enum("STANDARD ATM TEMPERATURE");
  ENUM SimOnGround = get_aircraft_var_enum("SIM ON GROUND");
  ENUM EngineTime = get_aircraft_var_enum("GENERAL ENG ELAPSED TIME");
  ENUM EngineStarter = get_aircraft_var_enum("GENERAL ENG STARTER");
  ENUM EngineIgniter = get_aircraft_var_enum("TURB ENG IGNITION SWITCH EX1");
  ENUM EngineCombustion = get_aircraft_var_enum("GENERAL ENG COMBUSTION");
  ENUM animDeltaTime = get_aircraft_var_enum("ANIMATION DELTA TIME");

  ENUM TankLeftAuxCapacity = get_aircraft_var_enum("FUEL TANK LEFT AUX CAPACITY");
  ENUM TankRightAuxCapacity = get_aircraft_var_enum("FUEL TANK RIGHT AUX CAPACITY");
  ENUM TankLeftCapacity = get_aircraft_var_enum("FUEL TANK LEFT MAIN CAPACITY");
  ENUM TankRightCapacity = get_aircraft_var_enum("FUEL TANK RIGHT MAIN CAPACITY");
  ENUM TankCenterCapacity = get_aircraft_var_enum("FUEL TANK CENTER CAPACITY");

  ENUM TankLeftAuxQuantity = get_aircraft_var_enum("FUEL TANK LEFT AUX QUANTITY");
  ENUM TankRightAuxQuantity = get_aircraft_var_enum("FUEL TANK RIGHT AUX QUANTITY");
  ENUM TankLeftQuantity = get_aircraft_var_enum("FUEL TANK LEFT MAIN QUANTITY");
  ENUM TankRightQuantity = get_aircraft_var_enum("FUEL TANK RIGHT MAIN QUANTITY");
  ENUM TankCenterQuantity = get_aircraft_var_enum("FUEL TANK CENTER QUANTITY");
  ENUM FuelTotalQuantity = get_aircraft_var_enum("FUEL TOTAL QUANTITY");
  ENUM FuelWeightGallon = get_aircraft_var_enum("FUEL WEIGHT PER GALLON");

  /// <summary>
  /// Collection of LVars for the A32NX
  /// </summary>
  ID Engine1N2;
  ID Engine2N2;
  ID Engine1N1;
  ID Engine2N1;
  ID EngineIdleN1;
  ID EngineIdleN2;
  ID EngineIdleFF;
  ID EngineIdleEGT;
  ID Engine1EGT;
  ID Engine2EGT;
  ID Engine1Oil;
  ID Engine2Oil;
  ID Engine1TotalOil;
  ID Engine2TotalOil;
  ID Engine1FF;
  ID Engine2FF;
  ID Engine1PreFF;
  ID Engine2PreFF;
  ID EngineCycleTime;
  ID EngineImbalance;
  ID FuelUsedLeft;
  ID FuelUsedRight;
  ID FuelLeftPre;
  ID FuelRightPre;
  ID FuelAuxLeftPre;
  ID FuelAuxRightPre;
  ID FuelCenterPre;
  ID RefuelRate;
  ID RefuelStartedByUser;
  ID FuelOverflowLeft;
  ID FuelOverflowRight;
  ID Engine1State;
  ID Engine2State;
  ID Engine1Timer;
  ID Engine2Timer;
  ID PumpStateLeft;
  ID PumpStateRight;

  SimVars() { this->initializeVars(); }

  void initializeVars() {
    Engine1N2 = register_named_variable("A32NX_ENGINE_N2:1");
    Engine2N2 = register_named_variable("A32NX_ENGINE_N2:2");
    Engine1N1 = register_named_variable("A32NX_ENGINE_N1:1");
    Engine2N1 = register_named_variable("A32NX_ENGINE_N1:2");
    EngineIdleN1 = register_named_variable("A32NX_ENGINE_IDLE_N1");
    EngineIdleN2 = register_named_variable("A32NX_ENGINE_IDLE_N2");
    EngineIdleFF = register_named_variable("A32NX_ENGINE_IDLE_FF");
    EngineIdleEGT = register_named_variable("A32NX_ENGINE_IDLE_EGT");
    Engine1EGT = register_named_variable("A32NX_ENGINE_EGT:1");
    Engine2EGT = register_named_variable("A32NX_ENGINE_EGT:2");
    Engine1Oil = register_named_variable("A32NX_ENGINE_TANK_OIL:1");
    Engine2Oil = register_named_variable("A32NX_ENGINE_TANK_OIL:2");
    Engine1TotalOil = register_named_variable("A32NX_ENGINE_TOTAL_OIL:1");
    Engine2TotalOil = register_named_variable("A32NX_ENGINE_TOTAL_OIL:2");
    Engine1FF = register_named_variable("A32NX_ENGINE_FF:1");
    Engine2FF = register_named_variable("A32NX_ENGINE_FF:2");
    Engine1PreFF = register_named_variable("A32NX_ENGINE_PRE_FF:1");
    Engine2PreFF = register_named_variable("A32NX_ENGINE_PRE_FF:2");
    EngineImbalance = register_named_variable("A32NX_ENGINE_IMBALANCE");
    FuelUsedLeft = register_named_variable("A32NX_FUEL_USED:1");
    FuelUsedRight = register_named_variable("A32NX_FUEL_USED:2");
    FuelLeftPre = register_named_variable("A32NX_FUEL_LEFT_PRE");
    FuelRightPre = register_named_variable("A32NX_FUEL_RIGHT_PRE");
    FuelAuxLeftPre = register_named_variable("A32NX_FUEL_AUX_LEFT_PRE");
    FuelAuxRightPre = register_named_variable("A32NX_FUEL_AUX_RIGHT_PRE");
    FuelCenterPre = register_named_variable("A32NX_FUEL_CENTER_PRE");
    RefuelRate = register_named_variable("A32NX_EFB_REFUEL_RATE_SETTING");
    RefuelStartedByUser = register_named_variable("A32NX_REFUEL_STARTED_BY_USR");
    Engine1State = register_named_variable("A32NX_ENGINE_STATE:1");
    Engine2State = register_named_variable("A32NX_ENGINE_STATE:2");
    Engine1Timer = register_named_variable("A32NX_ENGINE_TIMER:1");
    Engine2Timer = register_named_variable("A32NX_ENGINE_TIMER:2");
    PumpStateLeft = register_named_variable("A32NX_PUMP_STATE:1");
    PumpStateRight = register_named_variable("A32NX_PUMP_STATE:2");

    this->setEngine1N2(0);
    this->setEngine2N2(0);
    this->setEngine1N1(0);
    this->setEngine2N1(0);
    this->setEngineIdleN1(0);
    this->setEngineIdleN2(0);
    this->setEngineIdleFF(0);
    this->setEngineIdleEGT(0);
    this->setEngine1EGT(0);
    this->setEngine2EGT(0);
    this->setEngine1Oil(0);
    this->setEngine2Oil(0);
    this->setEngine1TotalOil(0);
    this->setEngine2TotalOil(0);
    this->setEngine1FF(0);
    this->setEngine2FF(0);
    this->setEngine1PreFF(0);
    this->setEngine2PreFF(0);
    this->setEngineImbalance(0);
    this->setFuelUsedLeft(0);
    this->setFuelUsedRight(0);
    this->setFuelLeftPre(0);
    this->setFuelRightPre(0);
    this->setFuelAuxLeftPre(0);
    this->setFuelAuxRightPre(0);
    this->setFuelCenterPre(0);
    this->setEngine1State(0);
    this->setEngine2State(0);
    this->setEngine1Timer(0);
    this->setEngine2Timer(0);
    this->setPumpStateLeft(0);
    this->setPumpStateRight(0);

    m_Units = new Units();
  }

  // Collection of LVar 'set' Functions
  void setEngine1N2(FLOAT64 value) { set_named_variable_value(Engine1N2, value); }
  void setEngine2N2(FLOAT64 value) { set_named_variable_value(Engine2N2, value); }
  void setEngine1N1(FLOAT64 value) { set_named_variable_value(Engine1N1, value); }
  void setEngine2N1(FLOAT64 value) { set_named_variable_value(Engine2N1, value); }
  void setEngineIdleN1(FLOAT64 value) { set_named_variable_value(EngineIdleN1, value); }
  void setEngineIdleN2(FLOAT64 value) { set_named_variable_value(EngineIdleN2, value); }
  void setEngineIdleFF(FLOAT64 value) { set_named_variable_value(EngineIdleFF, value); }
  void setEngineIdleEGT(FLOAT64 value) { set_named_variable_value(EngineIdleEGT, value); }
  void setEngine1EGT(FLOAT64 value) { set_named_variable_value(Engine1EGT, value); }
  void setEngine2EGT(FLOAT64 value) { set_named_variable_value(Engine2EGT, value); }
  void setEngine1Oil(FLOAT64 value) { set_named_variable_value(Engine1Oil, value); }
  void setEngine2Oil(FLOAT64 value) { set_named_variable_value(Engine2Oil, value); }
  void setEngine1TotalOil(FLOAT64 value) { set_named_variable_value(Engine1TotalOil, value); }
  void setEngine2TotalOil(FLOAT64 value) { set_named_variable_value(Engine2TotalOil, value); }
  void setEngine1FF(FLOAT64 value) { set_named_variable_value(Engine1FF, value); }
  void setEngine2FF(FLOAT64 value) { set_named_variable_value(Engine2FF, value); }
  void setEngine1PreFF(FLOAT64 value) { set_named_variable_value(Engine1PreFF, value); }
  void setEngine2PreFF(FLOAT64 value) { set_named_variable_value(Engine2PreFF, value); }
  void setEngineImbalance(FLOAT64 value) { set_named_variable_value(EngineImbalance, value); }
  void setFuelUsedLeft(FLOAT64 value) { set_named_variable_value(FuelUsedLeft, value); }
  void setFuelUsedRight(FLOAT64 value) { set_named_variable_value(FuelUsedRight, value); }
  void setFuelLeftPre(FLOAT64 value) { set_named_variable_value(FuelLeftPre, value); }
  void setFuelRightPre(FLOAT64 value) { set_named_variable_value(FuelRightPre, value); }
  void setFuelAuxLeftPre(FLOAT64 value) { set_named_variable_value(FuelAuxLeftPre, value); }
  void setFuelAuxRightPre(FLOAT64 value) { set_named_variable_value(FuelAuxRightPre, value); }
  void setFuelCenterPre(FLOAT64 value) { set_named_variable_value(FuelCenterPre, value); }
  void setEngine1State(FLOAT64 value) { set_named_variable_value(Engine1State, value); }
  void setEngine2State(FLOAT64 value) { set_named_variable_value(Engine2State, value); }
  void setEngine1Timer(FLOAT64 value) { set_named_variable_value(Engine1Timer, value); }
  void setEngine2Timer(FLOAT64 value) { set_named_variable_value(Engine2Timer, value); }
  void setPumpStateLeft(FLOAT64 value) { set_named_variable_value(PumpStateLeft, value); }
  void setPumpStateRight(FLOAT64 value) { set_named_variable_value(PumpStateRight, value); }

  // Collection of SimVar/LVar 'get' Functions
  FLOAT64 getEngine1N2() { return get_named_variable_value(Engine1N2); }
  FLOAT64 getEngine2N2() { return get_named_variable_value(Engine2N2); }
  FLOAT64 getEngine1N1() { return get_named_variable_value(Engine1N1); }
  FLOAT64 getEngine2N1() { return get_named_variable_value(Engine2N1); }
  FLOAT64 getEngineIdleN1() { return get_named_variable_value(EngineIdleN1); }
  FLOAT64 getEngineIdleN2() { return get_named_variable_value(EngineIdleN2); }
  FLOAT64 getEngineIdleFF() { return get_named_variable_value(EngineIdleFF); }
  FLOAT64 getEngineIdleEGT() { return get_named_variable_value(EngineIdleEGT); }
  FLOAT64 getEngine1FF() { return get_named_variable_value(Engine1FF); }
  FLOAT64 getEngine2FF() { return get_named_variable_value(Engine2FF); }
  FLOAT64 getEngine1EGT() { return get_named_variable_value(Engine1EGT); }
  FLOAT64 getEngine2EGT() { return get_named_variable_value(Engine2EGT); }
  FLOAT64 getEngine1Oil() { return get_named_variable_value(Engine1Oil); }
  FLOAT64 getEngine2Oil() { return get_named_variable_value(Engine2Oil); }
  FLOAT64 getEngine1TotalOil() { return get_named_variable_value(Engine1TotalOil); }
  FLOAT64 getEngine2TotalOil() { return get_named_variable_value(Engine2TotalOil); }
  FLOAT64 getEngine1PreFF() { return get_named_variable_value(Engine1PreFF); }
  FLOAT64 getEngine2PreFF() { return get_named_variable_value(Engine2PreFF); }
  FLOAT64 getEngineImbalance() { return get_named_variable_value(EngineImbalance); }
  FLOAT64 getFuelUsedLeft() { return get_named_variable_value(FuelUsedLeft); }
  FLOAT64 getFuelUsedRight() { return get_named_variable_value(FuelUsedRight); }
  FLOAT64 getFuelLeftPre() { return get_named_variable_value(FuelLeftPre); }
  FLOAT64 getFuelRightPre() { return get_named_variable_value(FuelRightPre); }
  FLOAT64 getFuelAuxLeftPre() { return get_named_variable_value(FuelAuxLeftPre); }
  FLOAT64 getFuelAuxRightPre() { return get_named_variable_value(FuelAuxRightPre); }
  FLOAT64 getFuelCenterPre() { return get_named_variable_value(FuelCenterPre); }
  FLOAT64 getRefuelRate() { return get_named_variable_value(RefuelRate); }
  FLOAT64 getRefuelStartedByUser() { return get_named_variable_value(RefuelStartedByUser); }
  FLOAT64 getPumpStateLeft() { return get_named_variable_value(PumpStateLeft); }
  FLOAT64 getPumpStateRight() { return get_named_variable_value(PumpStateRight); }
  FLOAT64 getCN1(int index) { return aircraft_varget(CorrectedN1, m_Units->Percent, index); }
  FLOAT64 getCN2(int index) { return aircraft_varget(CorrectedN2, m_Units->Percent, index); }
  FLOAT64 getN1(int index) { return aircraft_varget(N1, m_Units->Percent, index); }
  FLOAT64 getN2(int index) { return aircraft_varget(N2, m_Units->Percent, index); }
  FLOAT64 getOilPsi(int index) { return aircraft_varget(OilPSI, m_Units->Psi, index); }
  FLOAT64 getOilTemp(int index) { return aircraft_varget(OilTemp, m_Units->Celsius, index); }
  FLOAT64 getThrust(int index) { return aircraft_varget(Thrust, m_Units->Pounds, index); }
  FLOAT64 getEngine1State() { return get_named_variable_value(Engine1State); }
  FLOAT64 getEngine2State() { return get_named_variable_value(Engine2State); }
  FLOAT64 getEngine1Timer() { return get_named_variable_value(Engine1Timer); }
  FLOAT64 getEngine2Timer() { return get_named_variable_value(Engine2Timer); }
  FLOAT64 getFF(int index) { return aircraft_varget(correctedFF, m_Units->Pph, index); }
  FLOAT64 getMach() { return aircraft_varget(AirSpeedMach, m_Units->Mach, 0); }
  FLOAT64 getPlaneAltitude() { return aircraft_varget(PlaneAltitude, m_Units->Feet, 0); }
  FLOAT64 getPlaneAltitudeAGL() { return aircraft_varget(PlaneAltitudeAGL, m_Units->Feet, 0); }
  FLOAT64 getPressureAltitude() { return aircraft_varget(PressureAltitude, m_Units->Feet, 0); }
  FLOAT64 getVerticalSpeed() { return aircraft_varget(VerticalSpeed, m_Units->FeetMin, 0); }
  FLOAT64 getAmbientTemperature() { return aircraft_varget(AmbientTemp, m_Units->Celsius, 0); }
  FLOAT64 getStdTemperature() { return aircraft_varget(StdTemp, m_Units->Celsius, 0); }
  FLOAT64 getSimOnGround() { return aircraft_varget(SimOnGround, m_Units->Bool, 0); }
  FLOAT64 getTankLeftAuxCapacity() { return aircraft_varget(TankLeftAuxCapacity, m_Units->Gallons, 0); }
  FLOAT64 getTankRightAuxCapacity() { return aircraft_varget(TankRightAuxCapacity, m_Units->Gallons, 0); }
  FLOAT64 getTankLeftCapacity() { return aircraft_varget(TankLeftCapacity, m_Units->Gallons, 0); }
  FLOAT64 getTankRightCapacity() { return aircraft_varget(TankRightCapacity, m_Units->Gallons, 0); }
  FLOAT64 getTankCenterCapacity() { return aircraft_varget(TankCenterCapacity, m_Units->Gallons, 0); }
  FLOAT64 getTankLeftAuxQuantity() { return aircraft_varget(TankLeftAuxQuantity, m_Units->Gallons, 0); }
  FLOAT64 getTankRightAuxQuantity() { return aircraft_varget(TankRightAuxQuantity, m_Units->Gallons, 0); }
  FLOAT64 getTankLeftQuantity() { return aircraft_varget(TankLeftQuantity, m_Units->Gallons, 0); }
  FLOAT64 getTankRightQuantity() { return aircraft_varget(TankRightQuantity, m_Units->Gallons, 0); }
  FLOAT64 getTankCenterQuantity() { return aircraft_varget(TankCenterQuantity, m_Units->Gallons, 0); }
  FLOAT64 getFuelTotalQuantity() { return aircraft_varget(FuelTotalQuantity, m_Units->Gallons, 0); }
  FLOAT64 getFuelWeightGallon() { return aircraft_varget(FuelWeightGallon, m_Units->Pounds, 0); }
  FLOAT64 getEngineTime(int index) { return aircraft_varget(EngineTime, m_Units->Seconds, index); }
  FLOAT64 getEngineStarter(int index) { return aircraft_varget(EngineStarter, m_Units->Bool, index); }
  FLOAT64 getEngineIgniter(int index) { return aircraft_varget(EngineIgniter, m_Units->Number, index); }
  FLOAT64 getEngineCombustion(int index) { return aircraft_varget(EngineCombustion, m_Units->Bool, index); }
  FLOAT64 getAnimDeltaTime() { return aircraft_varget(animDeltaTime, m_Units->Seconds, 0); }
};
