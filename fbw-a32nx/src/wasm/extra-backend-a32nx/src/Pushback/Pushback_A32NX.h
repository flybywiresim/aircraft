// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_PUSHBACK_A32NX_H
#define FLYBYWIRE_AIRCRAFT_PUSHBACK_A32NX_H

#include "Pushback/Pushback.h"

/**
 * @brief Aircraft specific pushback implementation for the A32NX
 */
class Pushback_A32NX : public Pushback {
  static constexpr FLOAT64 PARKING_BRAKE_FACTOR = 100.0;  // slow down when parking brake is engaged by this factor
  static constexpr FLOAT64 SPEED_FACTOR         = 18.0;   // ft/sec for "VELOCITY BODY Z" (also max speed)
  static constexpr FLOAT64 TURN_SPEED_FACTOR    = 0.5;    // ft/sec for "ROTATION VELOCITY BODY Y"

 public:
  /**
   * Creates a new Pushback_A32NX instance and takes a reference to the MsfsHandler instance.
   * @param msfsHandler The MsfsHandler instance that is used to communicate with the simulator.
   */
  explicit Pushback_A32NX(MsfsHandler& msfsHandler) : Pushback(msfsHandler) {}

 private:
  constexpr int     getParkBrakeFactor() const override final { return PARKING_BRAKE_FACTOR; }
  constexpr FLOAT64 getSpeedFactor() const override final { return SPEED_FACTOR; }
  constexpr FLOAT64 getTurnSpeedFactor() const override final { return TURN_SPEED_FACTOR; }
};

#endif  // FLYBYWIRE_AIRCRAFT_PUSHBACK_A32NX_H
