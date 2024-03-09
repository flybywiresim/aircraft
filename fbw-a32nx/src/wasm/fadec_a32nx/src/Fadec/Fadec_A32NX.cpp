// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "Fadec_A32NX.h"

bool Fadec_A32NX::initialize() {

  _isInitialized = true;
  LOG_INFO("Fadec_A32NX initialized");
  return true;
}

bool Fadec_A32NX::preUpdate(sGaugeDrawData* pData) {
  // empty
  return true;
}

bool Fadec_A32NX::update(sGaugeDrawData* pData) {
  if (!_isInitialized) {
    std::cerr << "Fadec_A380X::update() - not initialized" << std::endl;
    return false;
  }

  // TODO: implement update logic
  if (msfsHandler.getTickCounter() % 200 == 0) std::cout << "Fadec_A32NX::update()" << std::endl;

  return true;
}

bool Fadec_A32NX::postUpdate(sGaugeDrawData* pData) {
  //  empty
  return true;
}

bool Fadec_A32NX::shutdown() {
  _isInitialized = false;
  LOG_INFO("Fadec_A332X::shutdown()");
  return true;
}
