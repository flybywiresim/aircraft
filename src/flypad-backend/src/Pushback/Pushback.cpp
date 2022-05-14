// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <iostream>

#include "InertialDampener.h"
#include "Pushback.h"

Pushback::Pushback() {
  inertialDampenerPtr = std::make_unique<InertialDampener>();
}

Pushback::~Pushback() = default;

void Pushback::initialize() {
  isInitialized = true;
  std::cout << "FLYPAD_BACKEND: Pushback initialized" << std::endl;
}

void Pushback::onUpdate(double deltaTime) {
  if (!isInitialized) {
    return;
  }
}

void Pushback::shutdown() {}
