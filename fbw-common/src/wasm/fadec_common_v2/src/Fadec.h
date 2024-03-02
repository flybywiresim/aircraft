// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_FADEC_H
#define FLYBYWIRE_AIRCRAFT_FADEC_H

#include "DataManager.h"
#include "EngineControl.h"
#include "Module.h"

class MsfsHandler;

using DataDefVector = std::vector<DataDefinition>;

class Fadec : public Module {
 private:

  // Convenience pointer to the data manager
  DataManager* dataManager = nullptr;

  EngineControl engineControlInstance;

  // used to calculate the time since the last update
  // TODO: unclear why dt is not sufficient
  double previousSimulationTime = 0;

 public:
  Fadec() = delete;

  /**
   * Creates a new Pushback instance and takes a reference to the MsfsHandler instance.
   * @param msfsHandler The MsfsHandler instance that is used to communicate with the simulator.
   */
  explicit Fadec(MsfsHandler& msfsHandler) : Module(msfsHandler) {}

  bool initialize() override;
  bool preUpdate(sGaugeDrawData* pData) override;
  bool update(sGaugeDrawData* pData) override;
  bool postUpdate(sGaugeDrawData* pData) override;
  bool shutdown() override;
  void initializeSimData();
};

#endif  // FLYBYWIRE_AIRCRAFT_FADEC_H
