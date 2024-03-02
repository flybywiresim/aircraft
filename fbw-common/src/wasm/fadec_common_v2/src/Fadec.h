// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_FADEC_H
#define FLYBYWIRE_AIRCRAFT_FADEC_H

#include "DataManager.h"
#include "Module.h"

class MsfsHandler;

using DataDefVector = std::vector<DataDefinition>;

class Fadec : public Module {

 public:
  Fadec() = delete;

  /**
   * Creates a new Pushback instance and takes a reference to the MsfsHandler instance.
   * @param msfsHandler The MsfsHandler instance that is used to communicate with the simulator.
   */
  explicit Fadec(MsfsHandler& msfsHandler) : Module(msfsHandler) {}

  virtual bool initialize() override = 0;
  virtual bool preUpdate(sGaugeDrawData* pData) override = 0;
  virtual bool update(sGaugeDrawData* pData) override= 0;
  virtual bool postUpdate(sGaugeDrawData* pData) override= 0;
  virtual bool shutdown() override= 0;
};

#endif  // FLYBYWIRE_AIRCRAFT_FADEC_H
