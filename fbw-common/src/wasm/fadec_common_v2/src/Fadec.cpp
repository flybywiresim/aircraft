// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "Fadec.h"

bool Fadec::initialize() {
  dataManager = &msfsHandler.getDataManager();


  _isInitialized = true;
  LOG_INFO("Fadec initialized");
  return true;
}

bool Fadec::preUpdate([[maybe_unused]] sGaugeDrawData* _pData) {
  // empty
  return true;
}

bool Fadec::update(sGaugeDrawData* pData) {
  if (!_isInitialized) {
    std::cerr << "Fadec::update() - not initialized" << std::endl;
    return false;
  }

  // TODO: Actual code here
  LOG_INFO("Fadec::update()");

  return true;
}

bool Fadec::postUpdate([[maybe_unused]] sGaugeDrawData* pData) {
  //  empty
  return true;
}

bool Fadec::shutdown() {
  _isInitialized = false;
  LOG_INFO("Fadec::shutdown()");
  return true;
}
