// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_ENGINECONTROL_H
#define FLYBYWIRE_AIRCRAFT_ENGINECONTROL_H

#include "SimDataStructs.h"
#include "ThrustLimits_A380X.hpp"
#include "Polynomials_A380X.hpp"

class EngineControl_A380X {
 private:

 public:
  void update(const ContextPtr& contextPtr);
};

#endif  // FLYBYWIRE_AIRCRAFT_ENGINECONTROL_H
