#pragma once

/// <summary>
/// SimConnect data types for sending the sim updates.
/// </summary>
enum DataTypesID {
  /// <summary>
  /// The data type ID to use when sending fuel controls data.
  /// </summary>
  FuelControls,
};

/// <summary>
/// Fuel controls.
/// </summary>
struct FuelControlData {
  /// <summary>
  /// Left Inner Wing Fuel Quantity in US Gallons.
  /// </summary>
  double FuelLeft;

  /// <summary>
  /// Right Inner Wing Fuel Quantity in US Gallons.
  /// </summary>
  double FuelRight;
};

/// <summary>
/// A collection of SimVar unit enums.
/// </summary>
class Units {
 public:
  /// <summary>
  /// The Percent SimVar unit.
  /// </summary>
  ENUM Percent = get_units_enum("Percent");

  /// <summary>
  /// The Pounds SimVar unit.
  /// </summary>
  ENUM Pounds = get_units_enum("Pounds");

  ENUM Pph = get_units_enum("Pounds per hour");

  ENUM Gallons = get_units_enum("Gallons");

  ENUM Feet = get_units_enum("Feet");

  /// <summary>
  /// The Foot pounds SimVar unit.
  /// </summary>
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
/// A collection of SimVar enums.
/// </summary>
class SimVars {
 public:
  Units* m_Units;

  /// MSFS Simulation Variables
  ENUM correctedN1 = get_aircraft_var_enum("TURB ENG CORRECTED N1");
  ENUM correctedFF = get_aircraft_var_enum("TURB ENG CORRECTED FF");
  ENUM PlaneAltitude = get_aircraft_var_enum("PLANE ALTITUDE");
  ENUM PlaneAltitudeAGL = get_aircraft_var_enum("PLANE ALT ABOVE GROUND");
  ENUM AirSpeedMach = get_aircraft_var_enum("AIRSPEED MACH");
  ENUM AmbientTemp = get_aircraft_var_enum("AMBIENT TEMPERATURE");
  ENUM VerticalSpeed = get_aircraft_var_enum("VERTICAL SPEED");
  ENUM StdTemp = get_aircraft_var_enum("STANDARD ATM TEMPERATURE");
  ENUM SimOnGround = get_aircraft_var_enum("SIM ON GROUND");
  ENUM EngineTime = get_aircraft_var_enum("GENERAL ENG ELAPSED TIME");

  // Fuel Tank Capacities
  ENUM TankLeftAuxCapacity = get_aircraft_var_enum("FUEL TANK LEFT AUX CAPACITY");
  ENUM TankRightAuxCapacity = get_aircraft_var_enum("FUEL TANK RIGHT AUX CAPACITY");
  ENUM TankLeftCapacity = get_aircraft_var_enum("FUEL TANK LEFT MAIN CAPACITY");
  ENUM TankRightCapacity = get_aircraft_var_enum("FUEL TANK RIGHT MAIN CAPACITY");
  ENUM TankCenterCapacity = get_aircraft_var_enum("FUEL TANK CENTER CAPACITY");

  // Fuel Tank Quantities
  ENUM TankLeftAuxQuantity = get_aircraft_var_enum("FUEL TANK LEFT AUX QUANTITY");
  ENUM TankRightAuxQuantity = get_aircraft_var_enum("FUEL TANK RIGHT AUX QUANTITY");
  ENUM TankLeftQuantity = get_aircraft_var_enum("FUEL TANK LEFT MAIN QUANTITY");
  ENUM TankRightQuantity = get_aircraft_var_enum("FUEL TANK RIGHT MAIN QUANTITY");
  ENUM TankCenterQuantity = get_aircraft_var_enum("FUEL TANK CENTER QUANTITY");
  ENUM FuelTotalQuantity = get_aircraft_var_enum("FUEL TOTAL QUANTITY");
  ENUM FuelWeightGallon = get_aircraft_var_enum("FUEL WEIGHT PER GALLON");

  /// <summary>
  /// The local variable for the bew EGT model.
  /// </summary>
  ID Engine1EGT;
  ID Engine2EGT;
  ID Engine1FF;
  ID Engine2FF;
  ID Engine1PreFF;
  ID Engine2PreFF;
  ID EngineCycleTime;
  ID EngineCrank;
  ID EngineImbalance;
  ID FuelUsedLeft;
  ID FuelUsedRight;
  ID FuelQuantityPre;
  ID FuelLeftPre;
  ID FuelRightPre;
  ID preFlightPhase;
  ID actualFlightPhase;

  SimVars() { this->initializeVars(); }

  void initializeVars() {
    // Initializing LVars
    Engine1EGT = register_named_variable("A32NX_ENGINE_EGT:1");
    Engine2EGT = register_named_variable("A32NX_ENGINE_EGT:2");
    Engine1FF = register_named_variable("A32NX_ENGINE_FF:1");
    Engine2FF = register_named_variable("A32NX_ENGINE_FF:2");
    Engine1PreFF = register_named_variable("A32NX_ENGINE_PRE_FF:1");
    Engine2PreFF = register_named_variable("A32NX_ENGINE_PRE_FF:2");
    EngineImbalance = register_named_variable("A32NX_ENGINE_IMBALANCE");
    FuelUsedLeft = register_named_variable("A32NX_FUEL_USED:1");
    FuelUsedRight = register_named_variable("A32NX_FUEL_USED:2");
    FuelQuantityPre = register_named_variable("A32NX_FUEL_QUANTITY_PRE");
    FuelLeftPre = register_named_variable("A32NX_FUEL_LEFT_PRE");
    FuelRightPre = register_named_variable("A32NX_FUEL_RIGHT_PRE");
    EngineCrank = register_named_variable("A32NX_ENGINE_CRACK");
    EngineCycleTime = register_named_variable("A32NX_ENGINE_CYCLE_TIME");
    preFlightPhase = register_named_variable("A32NX_FLIGHT_STATE_PREVIOUS");
    actualFlightPhase = register_named_variable("A32NX_FLIGHT_STATE_ACTUAL");

    this->setEngine1EGT(0);
    this->setEngine2EGT(0);
    this->setEngine1FF(0);
    this->setEngine2FF(0);
    this->setEngine1PreFF(0);
    this->setEngine2PreFF(0);
    this->setEngineImbalance(0);
    this->setFuelUsedLeft(0);
    this->setFuelUsedRight(0);
    this->setFuelQuantityPre(0);
    this->setEngineCrank(0);
    this->setEngineCycleTime(0);
    this->setPrePhase(-1);
    this->setActualPhase(-1);

    m_Units = new Units();
  }

  void setEngine1EGT(FLOAT64 value) { set_named_variable_value(Engine1EGT, value); }

  void setEngine2EGT(FLOAT64 value) { set_named_variable_value(Engine2EGT, value); }

  void setEngine1FF(FLOAT64 value) { set_named_variable_value(Engine1FF, value); }

  void setEngine2FF(FLOAT64 value) { set_named_variable_value(Engine2FF, value); }

  void setEngine1PreFF(FLOAT64 value) { set_named_variable_value(Engine1PreFF, value); }

  void setEngine2PreFF(FLOAT64 value) { set_named_variable_value(Engine2PreFF, value); }

  void setEngineImbalance(FLOAT64 value) { set_named_variable_value(EngineImbalance, value); }

  void setFuelUsedLeft(FLOAT64 value) { set_named_variable_value(FuelUsedLeft, value); }

  void setFuelUsedRight(FLOAT64 value) { set_named_variable_value(FuelUsedRight, value); }

  void setFuelQuantityPre(FLOAT64 value) { set_named_variable_value(FuelQuantityPre, value); }

  void setFuelLeftPre(FLOAT64 value) { set_named_variable_value(FuelLeftPre, value); }

  void setFuelRightPre(FLOAT64 value) { set_named_variable_value(FuelRightPre, value); }

  void setEngineCrank(FLOAT64 value) { set_named_variable_value(EngineCrank, value); }

  void setEngineCycleTime(FLOAT64 value) { set_named_variable_value(EngineCycleTime, value); }

  /// <summary>
  /// 0: Takeoff, 1: Climb, 2: Cruise, 3: Descent, 4: Landing
  /// </summary>
  void setPrePhase(FLOAT64 value) { set_named_variable_value(preFlightPhase, value); }

  void setActualPhase(FLOAT64 value) { set_named_variable_value(actualFlightPhase, value); }

  FLOAT64 getPrePhase() { return get_named_variable_value(preFlightPhase); }

  FLOAT64 getActualPhase() { return get_named_variable_value(actualFlightPhase); }

  FLOAT64 getEngine1FF() { return get_named_variable_value(Engine1FF); }

  FLOAT64 getEngine2FF() { return get_named_variable_value(Engine2FF); }

  FLOAT64 getEngine1PreFF() { return get_named_variable_value(Engine1PreFF); }

  FLOAT64 getEngine2PreFF() { return get_named_variable_value(Engine2PreFF); }

  FLOAT64 getEngineImbalance() { return get_named_variable_value(EngineImbalance); }

  FLOAT64 getEngineCycleTime() { return get_named_variable_value(EngineCycleTime); }

  FLOAT64 getFuelUsedLeft() { return get_named_variable_value(FuelUsedLeft); }

  FLOAT64 getFuelUsedRight() { return get_named_variable_value(FuelUsedRight); }

  FLOAT64 getFuelQuantityPre() { return get_named_variable_value(FuelQuantityPre); }

  FLOAT64 getFuelLeftPre() { return get_named_variable_value(FuelLeftPre); }

  FLOAT64 getFuelRightPre() { return get_named_variable_value(FuelRightPre); }

  FLOAT64 getCN1(int index) { return aircraft_varget(correctedN1, m_Units->Percent, index); }

  FLOAT64 getFF(int index) { return aircraft_varget(correctedFF, m_Units->Pph, index); }

  FLOAT64 getMach() { return aircraft_varget(AirSpeedMach, m_Units->Mach, 0); }

  FLOAT64 getPlaneAltitude() { return aircraft_varget(PlaneAltitude, m_Units->Feet, 0); }

  FLOAT64 getPlaneAltitudeAGL() { return aircraft_varget(PlaneAltitudeAGL, m_Units->Feet, 0); }

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
};
