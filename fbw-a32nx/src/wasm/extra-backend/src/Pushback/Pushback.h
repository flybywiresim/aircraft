// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_PUSHBACK_H
#define FLYBYWIRE_PUSHBACK_H

#include "DataManager.h"
#include "InertialDampener.h"
#include "Module.h"

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
  static const SIMCONNECT_NOTIFICATION_GROUP_ID NOTIFICATION_GROUP_1 = 1;

  // Convenience pointer to the data manager
  DataManager* dataManager = nullptr;

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
  ClientEventPtr tugHeadingEvent;
  ClientEventPtr tugSpeedEvent;

 public:
  Pushback() = delete;

  /**
   * Creates a new Pushback instance and takes a reference to the MsfsHandler instance.
   * @param msfsHandler The MsfsHandler instance that is used to communicate with the simulator.
   */
  explicit Pushback(MsfsHandler& msfsHandler) : Module(msfsHandler) {}

  bool initialize() override;
  bool preUpdate(sGaugeDrawData* pData) override;
  bool update(sGaugeDrawData* pData) override;
  bool postUpdate(sGaugeDrawData* pData) override;
  bool shutdown() override;

};

#endif  // FLYBYWIRE_PUSHBACK_H
