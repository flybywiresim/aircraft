// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_FADEC_A32NX_H
#define FLYBYWIRE_AIRCRAFT_FADEC_A32NX_H

#include "EngineControlA32NX.h"
#include "Fadec.h"

/**
 * @brief: The Fadec_A32NX class is responsible for managing the FADEC system for the A32NX aircraft.
 *
 * In this current implementation is only holding the EngineControl_A32NX instance and is
 * responsible for calling its initialize, update and shutdown methods.
 * The actual fadec logic is implemented in the EngineControl_A32NX class.
 */
class Fadec_A32NX : public Fadec {
 private:
  // Engine control instance
  EngineControl_A32NX engineControl{};

 public:
  /**
   * Creates a new Fadec_A32NX instance and takes a reference to the MsfsHandler instance.
   * @param msfsHandler The MsfsHandler instance that is used to communicate with the simulator.
   */
  explicit Fadec_A32NX(MsfsHandler& msfsHandler) : Fadec(msfsHandler) {}

  bool initialize() override;
  bool preUpdate(sGaugeDrawData*) override { return true; }
  bool update(sGaugeDrawData* pData) override;
  bool postUpdate(sGaugeDrawData*) override { return true; }
  bool shutdown() override;
};

#endif  // FLYBYWIRE_AIRCRAFT_FADEC_A32NX_H
