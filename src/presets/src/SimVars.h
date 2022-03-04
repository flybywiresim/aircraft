#pragma once

#include <string>;

// SimConnect data types to send Sim Updated
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

  // Collection of SimVars for the A32NX
  //  ENUM AmbientTemp = get_aircraft_var_enum("AMBIENT TEMPERATURE");
  //  ENUM animDeltaTime = get_aircraft_var_enum("ANIMATION DELTA TIME");
  ENUM lightPotentiometer = get_aircraft_var_enum("LIGHT POTENTIOMETER");

  // Collection of LVars for the A32NX
  ID DevVar;
  ID TestMode;
  ID TestVar;
  ID EfbBrightness;

  SimVars() {
    this->initializeVars();
  }

  void initializeVars() {
    m_Units = new Units();

    DevVar = register_named_variable("A32NX_DEVELOPER_STATE");
    TestVar = register_named_variable("A32NX_TEST_VAR");
    TestMode = register_named_variable("A32NX_TEST_MODE");
    this->setDeveloperState(0);
    this->setTestVar(0);
    this->setTestMode(0);

    EfbBrightness = register_named_variable("A32NX_EFB_BRIGHTNESS");

  }

  FLOAT64 getDeveloperState() { return get_named_variable_value(DevVar); }
  void setDeveloperState(FLOAT64 value) { set_named_variable_value(DevVar, value); }
  FLOAT64 getTestMode() { return get_named_variable_value(TestMode); }
  void setTestMode(FLOAT64 value) { set_named_variable_value(TestMode, value); }
  FLOAT64 getTestVar() { return get_named_variable_value(TestVar); }
  void setTestVar(FLOAT64 value) { set_named_variable_value(TestVar, value); }

  FLOAT64 getEfbBrightness() { return get_named_variable_value(EfbBrightness); }
  void setEfbBrightness(FLOAT64 value) { set_named_variable_value(EfbBrightness, value); }

  // Collection of SimVar get functions
  FLOAT64 getLightPotentiometer(int index) { return aircraft_varget(lightPotentiometer, m_Units->Percent, index); }
  void setLightPotentiometer(int index, int value) {
    std::string calculator_code;
    calculator_code += std::to_string(value);
    calculator_code += " ";
    calculator_code += std::to_string(index);
    calculator_code += " (>K:2:LIGHT_POTENTIOMETER_SET)";
    execute_calculator_code(calculator_code.c_str(), nullptr, nullptr, nullptr);
  }
};
