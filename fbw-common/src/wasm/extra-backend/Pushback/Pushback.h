// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_PUSHBACK_H
#define FLYBYWIRE_PUSHBACK_H

#include "DampingController.hpp"
#include "DataManager.h"
#include "Module.h"

#ifdef __cpp_lib_math_constants
#include <numbers>
constexpr double PI = std::numbers::pi;
#else
constexpr double PI = 3.14159265358979323846;
#endif

class MsfsHandler;

using DataDefinitionVector = std::vector<DataDefinition>;

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
  DampingController speedDampener{0.0, 0.15, 0.1};
  DampingController turnDampener{0.0, 0.01, 0.001};

  // LVARs
  NamedVariablePtr tugCommandedSpeedFactor;
  NamedVariablePtr tugCommandedHeadingFactor;

  // Base data structure for PushbackBaseInfo
  struct PushbackBaseInfo {
    FLOAT64 pushbackSystemEnabled;
    FLOAT64 parkingBrakeEngaged;
    FLOAT64 pushbackAttached;
    FLOAT64 aircraftHeading;
    FLOAT64 windVelBodyZ;
  };
  DataDefinitionVariablePtr<PushbackBaseInfo> pushbackBaseInfoPtr;

  // Data structure for PushbackDataID
  struct PushbackData {
    FLOAT64 pushbackWait;
    FLOAT64 velBodyX;
    FLOAT64 velBodyY;
    FLOAT64 velBodyZ;
    FLOAT64 rotVelBodyX;
    FLOAT64 rotVelBodyY;
    FLOAT64 rotVelBodyZ;
    FLOAT64 rotAccelBodyX;
    FLOAT64 rotAccelBodyY;
    FLOAT64 rotAccelBodyZ;
  };
  DataDefinitionVariablePtr<PushbackData> pushbackDataPtr;

  // Events
  ClientEventPtr tugHeadingEvent;
  ClientEventPtr tugSpeedEvent;

  // debug purposes - send LVARs for debugging to the flyPad
  NamedVariablePtr pushbackDebug;
  struct PushbackDebug {
    FLOAT64 updateDelta;
    FLOAT64 tugCommandedSpeed;
    FLOAT64 tugCommandedHeading;
    FLOAT64 tugInertiaSpeed;
    FLOAT64 rotXOut;
  };
  DataDefinitionVariablePtr<PushbackDebug> pushbackDebugPtr;

  // Profiler for measuring the update time
  //  SimpleProfiler profiler{"Pushback::update", 120};

 protected:
  // Aircraft configuration as LVARs
  NamedVariablePtr aircraftParkingBrakeFactor;
  NamedVariablePtr aircraftSpeedFactor;
  NamedVariablePtr aircraftTurnSpeedFactor;

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

 protected:
  /**
   * @brief Returns the park brake factor for slowing down when the parking brake is engaged.
   * @return The park brake factor.
   */
  virtual constexpr int getParkBrakeFactor() const = 0;  // slow down when parking brake is engaged by this factor

  /**
   * @brief Returns the speed factor for the pushback for the aircraft
   * @return the speed factor
   */
  virtual constexpr FLOAT64 getSpeedFactor() const = 0;  // ft/sec for "VELOCITY BODY Z"

  /**
   * @brief Returns the turn speed factor for the pushback for the aircraft
   * @return the turn speed factor
   */
  virtual constexpr FLOAT64 getTurnSpeedFactor() const = 0;  // ft/sec for "ROTATION VELOCITY BODY Y"
};

#endif  // FLYBYWIRE_PUSHBACK_H
