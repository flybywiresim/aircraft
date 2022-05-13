// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

//
// Created by frank on 13.05.2022.
//

#include "Pushback.h"
#include "InertialDampener.h"

Pushback::Pushback() {
  inertialDampenerPtr = std::make_unique<InertialDampener>();
}

Pushback::~Pushback() = default;

void Pushback::initialize() {
  isInitialized = true;
  std::cout << "PRESETS: LightPresets initialized" << std::endl;
}

void Pushback::onUpdate(double deltaTime) {
  if (!isInitialized) {
    return;
  }
}

void Pushback::shutdown() {}
