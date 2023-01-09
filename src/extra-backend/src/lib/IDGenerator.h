// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_IDGENERATOR_H
#define FLYBYWIRE_IDGENERATOR_H

#include <cstdint>

#include <MSFS/Legacy/gauges.h>

/**
 * This class is used to generate unique IDs for the modules.
 * Uniqueness is only guaranteed within the same instance of this class.
 * It is used to identify the modules in the MSFS gauges system.
 *
 * Starts at one - never returns zero.
 */
class IDGenerator {
private:
  uint64_t nextId = 1;

public:
  inline uint64_t getNextId() { return nextId++; };
};

#endif // FLYBYWIRE_IDGENERATOR_H
