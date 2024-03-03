// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_ENGINECONTROL_H
#define FLYBYWIRE_AIRCRAFT_ENGINECONTROL_H

#include "Fadec_A380X.h"

class EngineControl_A380X {
 private:

 public:
  void update(const ContextPtr& context);
};

#endif  // FLYBYWIRE_AIRCRAFT_ENGINECONTROL_H
