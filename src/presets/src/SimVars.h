#pragma once

/// <summary>
/// SimConnect data types to send Sim Updated
/// </summary>
enum DataTypesID {
  SimulationDataTypeId,
};

struct SimulationData {
  double simulationTime;
  double simulationRate;
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
  //  ENUM AmbientTemp = get_aircraft_var_enum("AMBIENT TEMPERATURE");
  //  ENUM animDeltaTime = get_aircraft_var_enum("ANIMATION DELTA TIME");
  ENUM lightingOvhdIntLt = get_aircraft_var_enum("LIGHT POTENTIOMETER");

  /// <summary>
  /// Collection of LVars for the A32NX
  /// </summary>
  ID DevVar;
  ID TestVar;

  SimVars() { this->initializeVars(); }

  void initializeVars() {
    DevVar = register_named_variable("A32NX_DEVELOPER_STATE");
    TestVar = register_named_variable("A32NX_TEST_VAR");

    this->setDeveloperState(0);
    this->setTestVar(0);

    m_Units = new Units();
  }

  // Collection of LVar 'set' Functions
  void setDeveloperState(FLOAT64 value) { set_named_variable_value(DevVar, value); }
  void setTestVar(FLOAT64 value) { set_named_variable_value(TestVar, value); }

  // Collection of LVar 'get' Functions
  FLOAT64 getDeveloperState() { return get_named_variable_value(DevVar); }
  FLOAT64 getTestVar() { return get_named_variable_value(TestVar); }

  // Collection of SimVar get functions
  FLOAT64 getLightingOvhdIntLt() { return aircraft_varget(lightingOvhdIntLt, m_Units->Percent, 86); }

};
