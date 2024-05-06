// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "Fadec_A32NX.h"

bool Fadec_A32NX::initialize() {
  engineControl.initialize(&msfsHandler);

  _isInitialized = true;
  LOG_INFO("Fadec_A32NX initialized");
  return true;
}

bool Fadec_A32NX::update([[maybe_unused]] sGaugeDrawData* pData) {
  if (!_isInitialized) {
    std::cerr << "Fadec_A32NX::update() - not initialized" << std::endl;
    return false;
  }

  engineControl.update();

  return true;
}

bool Fadec_A32NX::shutdown() {
  _isInitialized = false;
  LOG_INFO("Fadec_A32NX::shutdown()");
  return true;
}
