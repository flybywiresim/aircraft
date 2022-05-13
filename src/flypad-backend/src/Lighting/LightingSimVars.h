// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#pragma once

#include <string>

#include "../Units.h"

/**
 * For instruments with are specific to the left (Cpt) or right (FO) side of the cockpit.
 */
enum Side {
  Left, Right
};

/**
 * A collection of SimVars and LVars for the A32NX for interior lighting
 */
class LightingSimVars {
public:
  Units* m_Units;

  // Power state LVARs
  ID ElecAC1{};

  // Signal to load a preset.
  ID LoadLightingPresetRequest{};
  ID SaveLightingPresetRequest{};

  // Simvar light variables
  ENUM lightPotentiometer{};

  // LVAR Light variables
  ID EfbBrightness{};
  ID DcduLeftLightLevel{};
  ID DcduRightLightLevel{};
  ID McduLeftLightLevel{};
  ID McduRightLightLevel{};

  LightingSimVars() {
    m_Units = new Units();
    this->initializeVars();
  }

  /**
   * Initializes  variables by registering them in SimConnect
   */
  void initializeVars() {
    // Power state LVar
    ElecAC1 = register_named_variable("A32NX_ELEC_AC_1_BUS_IS_POWERED");

    // Named Variables (LVARs)
    LoadLightingPresetRequest = register_named_variable("A32NX_LOAD_LIGHTING_PRESET");
    this->setLoadLightingPresetRequest(0);
    SaveLightingPresetRequest = register_named_variable("A32NX_SAVE_LIGHTING_PRESET");
    this->setSaveLightingPresetRequest(0);

    // Sim variables
    lightPotentiometer = get_aircraft_var_enum("LIGHT POTENTIOMETER");

    // Lighting LVARs
    EfbBrightness = register_named_variable("A32NX_EFB_BRIGHTNESS");
    DcduLeftLightLevel = register_named_variable("A32NX_PANEL_DCDU_L_BRIGHTNESS");
    DcduRightLightLevel = register_named_variable("A32NX_PANEL_DCDU_R_BRIGHTNESS");
    McduLeftLightLevel = register_named_variable("A32NX_MCDU_L_BRIGHTNESS");
    McduRightLightLevel = register_named_variable("A32NX_MCDU_R_BRIGHTNESS");
  }

  /**
   * Get the ElecAC1 state
   * @return INT64 0 if AC1 bus is unpowered, 1 otherwise
   */
  inline FLOAT64 getElecAC1State() const {
    return get_named_variable_value(ElecAC1);
  }

  /**
   * Reads the  preset loading request variable.
   * @return INT64 signifying the preset to be loaded
   */
  inline FLOAT64 getLoadLightingPresetRequest() const {
    return get_named_variable_value(LoadLightingPresetRequest);
  }

  /**
   * Sets the loading request value. Typically used to reset to 0 after the preset has been loaded.
   * @param value usually loadFromData to 0 to reset the request.
   */
  inline void setLoadLightingPresetRequest(FLOAT64 value) const {
    set_named_variable_value(LoadLightingPresetRequest, value);
  }

  /**
   * Reads the request preset save variable.
   * @return INT64 signifying the preset to be loaded
   */
  inline FLOAT64 getSaveLightingPresetRequest() const {
    return get_named_variable_value(SaveLightingPresetRequest);
  }

  /**
   * Sets the save request value. Typically used to reset to 0 after the preset has been loaded.
   * @param value usually loadFromData to 0 to reset the request.
   */
  inline void setSaveLightingPresetRequest(FLOAT64 value) const {
    set_named_variable_value(SaveLightingPresetRequest, value);
  }

  /**
   * Retrieves the EFB brightness setting from the simulator.
   * @return value in percent over 100 (0..100)
   */
  inline FLOAT64 getEfbBrightness() const {
    return get_named_variable_value(EfbBrightness);
  }

  /**
   * Set the EFB brightness.
   * @param value in percent over 100 (0..100)
   */
  inline void setEfbBrightness(FLOAT64 value) const {
    set_named_variable_value(EfbBrightness, value);
  }

  /**
   * Retrieves the DCDU brightness level from the simulator.
   * @param s Side.Left or Side.Right
   * @return value in percent (0.0 .. 1.0)
   */
  FLOAT64 getDcduLightLevel(Side s) const {
    switch (s) {
      case Left:
        return get_named_variable_value(DcduLeftLightLevel);
      case Right:
        return get_named_variable_value(DcduRightLightLevel);
    }
  }

  /**
   * Sets the DCDU brightness level to the simulator.
   * @param s Side.Left or Side.Right
   */
  void setDcduLightLevel(Side s, FLOAT64 value) const {
    switch (s) {
      case Left:
        set_named_variable_value(DcduLeftLightLevel, value);
        break;
      case Right:
        set_named_variable_value(DcduRightLightLevel, value);
        break;
    }
  }

  /**
   * Retrieves the MCDU brightness level from the simulator.
   * @param s Side.Left or Side.Right
   * @return value in percent (0.0 .. 1.0)
   */
  FLOAT64 getMcduLightLevel(Side s) const {
    switch (s) {
      case Left:
        return get_named_variable_value(McduLeftLightLevel);
      case Right:
        return get_named_variable_value(McduRightLightLevel);
    }
  }

  /**
   * Sets the MCDU brightness level to the simulator.
   * @param s Side.Left or Side.Right
   */
  void setMcduLightLevel(Side s, FLOAT64 value) const {
    switch (s) {
      case Left:
        set_named_variable_value(McduLeftLightLevel, value);
        break;
      case Right:
        set_named_variable_value(McduRightLightLevel, value);
        break;
    }
  }

  /**
   * Retrieves a light potentiometer setting from the simulator.
   * @param index of the light potentiometer
   * @return value in percent over 100 (0..100)
   */
  inline FLOAT64 getLightPotentiometer(int index) const {
    return aircraft_varget(lightPotentiometer, m_Units->Percent, index);
  }

  /**
   * Sets a light potentiometer setting to the simulator.
   * @param index the light potentiometer index
   * @param value in percent over 100 (0..100)
   */
  static void setLightPotentiometer(int index, FLOAT64 value) {
    std::string calculator_code;
    calculator_code += std::to_string(value);
    calculator_code += " ";
    calculator_code += std::to_string(index);
    calculator_code += " (>K:2:LIGHT_POTENTIOMETER_SET)";
    execute_calculator_code(calculator_code.c_str(), nullptr, nullptr, nullptr);
  }

  /**
   * Retrieves the switch position of the dome light switch.
   * 0 = switch pos OFF, 50 = switch pos DIM, 100 = switch pos BRT
   * @return value in percent over 100 (0..100)
   */
  inline FLOAT64 getLightCabin() const {
    return getLightPotentiometer(7);
  }

  /**
   * Sets the dome light switch in one of 3 positions.
   * @param lvl 0 = OFF, 50 = DIM, 100 = BRT
   */
  static void setLightCabin(FLOAT64 lvl) {
    // cabin light level needs to either be 0, 50 or 100 for the switch position
    // in the aircraft to work.
    if (lvl <= 0.0) {
      lvl = 0.0;
    }
    else if (lvl > 0.0 && lvl <= 50.0) {
      lvl = 50.0;
    }
    else if ((lvl > 0.0 && lvl > 50.0)) {
      lvl = 100.0;
    }
    // set the switch position via calculator code
    std::string calculator_code;
    calculator_code += std::to_string(lvl > 0 ? 1 : 0);
    calculator_code += " (>K:2:CABIN_LIGHTS_SET) ";
    calculator_code += std::to_string(lvl);  // 0, 50% and 100%
    calculator_code += " (>K:LIGHT_POTENTIOMETER_7_SET)";
    execute_calculator_code(calculator_code.c_str(), nullptr, nullptr, nullptr);
  }
};
