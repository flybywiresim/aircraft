// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_ENGINECONTROL_H
#define FLYBYWIRE_AIRCRAFT_ENGINECONTROL_H

#include "SimVars.h"

class EngineControl_A380X {
 private:
  double mach;
  double pressAltitude;
  double ambientTemp;
  double ambientPressure;
  bool simOnGround;

 public:
  void update(ContextPtr context);
};

#endif  // FLYBYWIRE_AIRCRAFT_ENGINECONTROL_H
