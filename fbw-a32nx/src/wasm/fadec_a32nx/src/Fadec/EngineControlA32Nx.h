// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_ENGINECONTROLA32NX_H
#define FLYBYWIRE_AIRCRAFT_ENGINECONTROLA32NX_H

#include "MsfsHandler.h"

#include "FadecSimData_A32NX.hpp"

class EngineControl_A32NX {
 private:
  // Convenience pointer to the msfs handler
  MsfsHandler* msfsHandlerPtr = nullptr;
  // Convenience pointer to the data manager
  DataManager* dataManagerPtr = nullptr;
  // FADEC simulation data
  FadecSimData_A32NX simData{};


 public:
  void initialize(MsfsHandler* msfsHandler);
  void update();
  void shutdown();

};

#endif  // FLYBYWIRE_AIRCRAFT_ENGINECONTROLA32NX_H
