// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_FADEC_A32NX_H
#define FLYBYWIRE_AIRCRAFT_FADEC_A32NX_H

#include "EngineControl_A380X.h"
#include "Fadec.h"
#include "SimDataStructs.h"

using ContextPtr = std::shared_ptr<Context>;

class Fadec_A380X : public Fadec {
 private:

  // Convenience pointer to the data manager
  DataManager* dataManager = nullptr;

  // Data definition pointers for the sim data we need
  DataDefinitionVariablePtr<PayloadData> payloadDataPtr;
  DataDefinitionVariablePtr<FuelTankData> fuelTankDataPtr;
  DataDefinitionVariablePtr<OilData> oilDataPtr;
  DataDefinitionVariablePtr<EngineData> engineDataPtr;
  DataDefinitionVariablePtr<SimData> simDataPtr;

  // Convenience struct to hold all required sim data to pass to the subcomponents
  ContextPtr context;

  EngineControl_A380X engineControlInstance{};


 public:
  /**
   * Creates a new Fadec_A32NX instance and takes a reference to the MsfsHandler instance.
   * @param msfsHandler The MsfsHandler instance that is used to communicate with the simulator.
   */
  explicit Fadec_A380X(MsfsHandler& msfsHandler) : Fadec(msfsHandler) {}

  bool initialize() override;
  bool preUpdate(sGaugeDrawData* pData) override;
  bool update(sGaugeDrawData* pData) override;
  bool postUpdate(sGaugeDrawData* pData) override;
  bool shutdown() override;
};

#endif  // FLYBYWIRE_AIRCRAFT_FADEC_A32NX_H
