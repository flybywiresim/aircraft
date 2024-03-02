// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_FADEC_A32NX_H
#define FLYBYWIRE_AIRCRAFT_FADEC_A32NX_H

#include "Fadec.h"

class Fadec_A380X : public Fadec {
 public:
  /**
   * Creates a new Fadec_A32NX instance and takes a reference to the MsfsHandler instance.
   * @param msfsHandler The MsfsHandler instance that is used to communicate with the simulator.
   */
  explicit Fadec_A380X(MsfsHandler& msfsHandler) : Fadec(msfsHandler) {}
};

#endif  // FLYBYWIRE_AIRCRAFT_FADEC_H
