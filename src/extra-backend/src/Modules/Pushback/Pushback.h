// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_PUSHBACK_H
#define FLYBYWIRE_PUSHBACK_H

#include "Module.h"
#include "DataManager.h"
#include "InertialDampener.h"

#ifdef __cpp_lib_math_constants
#include <numbers>
constexpr double PI = std::numbers::pi;
#else
constexpr double PI = 3.14159265358979323846;
#endif

class MsfsHandler;

/**
 * This module is responsible for the pushback process.
 *
 * It is controlled by two LVARs:
 * - A32NX_PUSHBACK_SYSTEM_ENABLED
 * - A32NX_PUSHBACK_SPD_FACTOR
 * - A32NX_PUSHBACK_HDG_FACTOR
 *
 * - Pushback Attached (simvar)
 * - SIM ON GROUND (simvar)
 */
class Pushback : public Module {
private:

  // Convenience pointer to the data manager
  DataManager* dataManager{};

  // Used to smoothen acceleration and deceleration
  InertialDampener inertialDampener{0.0, 0.15};

  // LVARs
  NamedVariablePtr pushbackSystemEnabled;
  NamedVariablePtr parkingBrakeEngaged;
  NamedVariablePtr tugCommandedHeadingFactor;
  NamedVariablePtr tugCommandedSpeedFactor;
  // debug purposes - send as LVARs for debugging to the flyPad
  NamedVariablePtr tugCommandedHeading;
  NamedVariablePtr tugCommandedSpeed;
  NamedVariablePtr tugInertiaSpeed;
  NamedVariablePtr updateDelta;
  NamedVariablePtr rotXOut;

  // Sim-vars
  AircraftVariablePtr simOnGround;
  AircraftVariablePtr pushbackAttached;
  AircraftVariablePtr aircraftHeading;
  AircraftVariablePtr windVelBodyZ;

  // Data structure for PushbackDataID
  struct PushbackData {
    [[maybe_unused]] FLOAT64 pushbackWait;
    [[maybe_unused]] FLOAT64 velBodyZ;
    [[maybe_unused]] FLOAT64 rotVelBodyY;
    [[maybe_unused]] FLOAT64 rotAccelBodyX;
  };
  std::shared_ptr<DataDefinitionVariable<PushbackData>> pushbackData;

  // Events
  EventPtr tugHeadingEvent;
  EventPtr tugSpeedEvent;

public:
  Pushback() = delete;

  /**
   * Creates a new Pushback instance and takes a reference to the MsfsHandler instance.
   * @param msfsHandler The MsfsHandler instance that is used to communicate with the simulator.
   */
  explicit Pushback(MsfsHandler* msfsHandler) : Module(msfsHandler) {}

  bool initialize() override;
  bool preUpdate(sGaugeDrawData* pData) override;
  bool update(sGaugeDrawData* pData) override;
  bool postUpdate(sGaugeDrawData* pData) override;
  bool shutdown() override;

private:

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

#endif //FLYBYWIRE_PUSHBACK_H
