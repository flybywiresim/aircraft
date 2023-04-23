// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_IDGENERATOR_H
#define FLYBYWIRE_IDGENERATOR_H

#include <cstdint>

/**
 * @brief The IDGenerator class is used to generate unique IDs for the modules.
 *
 * Largest possible value is 2^64 - 1 (uint_64_t) then it wraps around.
 * Uniqueness is only guaranteed within the same instance of this class.
 * It is used to identify the modules in the MSFS gauges system.
 */
class IDGenerator {
 private:
  uint64_t nextId = 0;

 public:
  inline uint64_t getNextId() { return nextId++; };
};

#endif  // FLYBYWIRE_IDGENERATOR_H
