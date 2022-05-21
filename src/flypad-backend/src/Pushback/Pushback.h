// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#pragma once

#include <MSFS/Legacy/gauges.h>
#include <MSFS/MSFS.h>
#include <MSFS/MSFS_Render.h>
#include <SimConnect.h>

#include <memory>


#include "Units.h"
#include "FlyPadBackend.h"

class InertialDampener;

using namespace std;

constexpr double PI = 3.14159265358979323846;

/**
 * Class for handling aircraft presets.
 */
class Pushback {

private:
  HANDLE hSimConnect;
  bool isInitialized = false;

  PushbackData* pushbackDataPtr;

  std::unique_ptr<Units> m_Units;
  std::unique_ptr<InertialDampener> inertialDampenerPtr;

  // LVARs
  ID pushbackSystemEnabled{};
  ID pushbackPaused{};
  ID tugCommandedHeadingFactor{};
  ID tugCommandedHeading{};
  ID tugCommandedSpeedFactor{};
  ID tugCommandedSpeed{};
  ID tugInertiaSpeed{};
  ID parkingBrakeEngaged{};
  ID updateDelta{};
  ID rotXInput{};
  ID rotXOut{};

  // Simvars
  ENUM simOnGround{};
  ENUM pushbackAttached{};
  ENUM aircraftHeading{};
  ENUM windVelBodyZ{};

public:
  /**
   * Creates an instance of the Pushback class.
   */
  Pushback(HANDLE hdl, PushbackData* data);

  /**
   * Destructor
   */
  ~Pushback();

  /**
   * Called when SimConnect is initialized
   */
  void initialize();

  /**
   * Callback used to update the LightPreset at each tick (dt).
   * This is used to execute every action and task required to update the light Settings.
   * @param deltaTime The time since the last tick
   * @return True if successful, false otherwise.
   */
  void onUpdate(double deltaTime);

  /**
   * Called when SimConnect is shut down
   */
  void shutdown();

private:
  // @formatter:off
  // LVAR getter
  inline bool isPushbackPaused() const { return static_cast<bool>(get_named_variable_value(pushbackPaused)); }
  inline bool isPushbackSystemEnabled() const { return static_cast<bool>(get_named_variable_value(pushbackSystemEnabled)); }
  inline bool isParkingBrakeEngaged() const { return static_cast<bool>(get_named_variable_value(parkingBrakeEngaged)); }
  inline FLOAT64 getTugCmdSpdFactor() const { return static_cast<FLOAT64>(get_named_variable_value(tugCommandedSpeedFactor)); }
  inline FLOAT64 getTugCmdHdgFactor() const { return static_cast<FLOAT64>(get_named_variable_value(tugCommandedHeadingFactor)); }

  // Simvar getter
  inline bool isPushbackAttached() const { return static_cast<bool>(aircraft_varget(pushbackAttached, m_Units->Bool, 0)); }
  inline bool isSimOnGround() const { return static_cast<bool>(aircraft_varget(simOnGround, m_Units->Bool, 0)); }
  inline FLOAT64 getAircraftTrueHeading() const {
    return (180.0 / PI) * static_cast<FLOAT64>(aircraft_varget(aircraftHeading, m_Units->Number, 0));
  }
  inline FLOAT64 getWindVelBodyZ() const { return static_cast<FLOAT64>(aircraft_varget(windVelBodyZ, m_Units->FeetSec, 0)); }
  // Sim data getter
  inline bool isPushbackWaiting() const { return static_cast<bool>(pushbackDataPtr->pushbackWait); }
  // @formatter:on

  /**
   * Adds two angles with wrap around to result in 0-360°
   * @param a - positive or negative angle
   * @param b - positive or negative angle
   */
  static double angleAdd(double a, double b) {
    double r = a + b;
    while (r > 360.0) {
      r -= 360.0;
    }
    while (r < 0.0) {
      r += 360.0;
    }
    return r;
  };

  /**
   * Returns the signum (sign) of the given value.
   * @tparam T
   * @param val
   * @return sign of value or 0 when value==0
   */
  template<typename T>
  int sgn(T val) {
    return (T(0) < val) - (val < T(0));
  }

};
