#pragma once

#include <string>

// SimConnect data types to send Sim Updated
enum DataTypesID {
  SimulationDataTypeId,
};

enum Side {
  Left,
  Right
};

enum TwoWay {
  POS2_0,
  POS2_1
};

enum ThreeWay {
  POS3_0,
  POS3_1,
  POS3_2
};

struct SimulationData {
  double simulationTime;
  double simulationRate;
};

// A collection of SimVar unit enums.
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

// A collection of SimVars and LVars for the A32NX
class SimVars {
 public:
  Units* m_Units;

  // Collection of SimVars for the A32NX
  //  ENUM AmbientTemp = get_aircraft_var_enum("AMBIENT TEMPERATURE");
  //  ENUM animDeltaTime = get_aircraft_var_enum("ANIMATION DELTA TIME");
  ENUM lightPotentiometer = get_aircraft_var_enum("LIGHT POTENTIOMETER");
  ENUM lightCabin = get_aircraft_var_enum("LIGHT CABIN");

  // Collection of LVars for the A32NX
  ID DevVar;
  ID TestMode;
  ID TestVar;

  ID EfbBrightness;
  ID DcduLeftLightLevel;
  ID DcduRightLightLevel;
  ID McduLeftLightLevel;
  ID McduRightLightLevel;

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
    DcduLeftLightLevel = register_named_variable("A32NX_PANEL_DCDU_L_BRIGHTNESS");
    DcduRightLightLevel = register_named_variable("A32NX_PANEL_DCDU_R_BRIGHTNESS");
    McduLeftLightLevel = register_named_variable("A32NX_MCDU_L_BRIGHTNESS");
    McduRightLightLevel = register_named_variable("A32NX_MCDU_R_BRIGHTNESS");

  }

  FLOAT64 getDeveloperState() { return get_named_variable_value(DevVar); }
  void setDeveloperState(FLOAT64 value) { set_named_variable_value(DevVar, value); }
  FLOAT64 getTestMode() { return get_named_variable_value(TestMode); }
  void setTestMode(FLOAT64 value) { set_named_variable_value(TestMode, value); }
  FLOAT64 getTestVar() { return get_named_variable_value(TestVar); }
  void setTestVar(FLOAT64 value) { set_named_variable_value(TestVar, value); }

  FLOAT64 getEfbBrightness() { return get_named_variable_value(EfbBrightness); }
  void setEfbBrightness(FLOAT64 value) { set_named_variable_value(EfbBrightness, value); }

//  FLOAT64 getEfbBrightness() { return get_named_variable_value(EfbBrightness); }
//  void setEfbBrightness(FLOAT64 value) { set_named_variable_value(EfbBrightness, value); }

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

  ThreeWay getLightCabin() {
    if (aircraft_varget(lightCabin, m_Units->Bool, 0) == 1) {
      const FLOAT64 potentiometer = getLightPotentiometer(7);
      switch ((int)potentiometer) {
        case 50: return POS3_1;
        case 100: return POS3_2;
        default: return POS3_0;
      }
    }
    return POS3_0;
  }
  /**
   * Sets the dome light switch in one of 3 positions.
   * @param switchState POS3_0 = OFF, POS3_1 = DIM,, POS_2 = HIGH
   */
  void setLightCabin(ThreeWay switchState) {
    std::string calculator_code;
    calculator_code += std::to_string(switchState);
    calculator_code += " (>K:2:CABIN_LIGHTS_SET) ";
    calculator_code += std::to_string(switchState * 50); // 0, 50% and 100%
    calculator_code += " (>K:LIGHT_POTENTIOMETER_7_SET)";
    execute_calculator_code(calculator_code.c_str(), nullptr, nullptr, nullptr);
  }

};
