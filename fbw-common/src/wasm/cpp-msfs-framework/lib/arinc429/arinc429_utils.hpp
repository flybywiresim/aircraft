// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_ARINC429_UTILS_HPP
#define FLYBYWIRE_AIRCRAFT_ARINC429_UTILS_HPP

#include <cstdint>

#include "elac_computer_types.h"

/**
 * @brief Utility class for handling ARINC429 words.
 *
 * TODO: document this properly
 */
class Arinc429Utils {
 public:
  static base_arinc_429 fromSimVar(double simVar) {
    base_arinc_429 word{};

    const auto     u64Val = static_cast<uint64_t>(simVar);
    const uint32_t u32Val = u64Val & 0xffffffff;
    word.SSM              = u64Val >> 32;
    word.Data             = *reinterpret_cast<const real32_T*>(&u32Val);

    return word;
  }

  static double toSimVar(base_arinc_429 word) {
    const uint64_t u64Val = *reinterpret_cast<const uint32_t*>(&word.Data) | static_cast<uint64_t>(word.SSM) << 32;
    return static_cast<double>(u64Val);
  }

  static bool isFw(base_arinc_429 word) {  //
    return static_cast<SignStatusMatrix>(word.SSM) == SignStatusMatrix::FailureWarning;
  }

  static bool isNo(base_arinc_429 word) {  //
    return static_cast<SignStatusMatrix>(word.SSM) == SignStatusMatrix::NormalOperation;
  }

  static float valueOr(base_arinc_429 word, float defaultVal) {
    auto castSsm = static_cast<SignStatusMatrix>(word.SSM);
    if (castSsm == SignStatusMatrix::NormalOperation || castSsm == SignStatusMatrix::FunctionalTest) {
      return word.Data;
    } else {
      return defaultVal;
    }
  }

  static bool bitFromValue(base_arinc_429 word, int bit) {  //
    return (static_cast<uint32_t>(word.Data) >> (bit - 1)) & 0x01;
  }

  static bool bitFromValueOr(base_arinc_429 word, int bit, bool defaultVal) {
    auto castSsm = static_cast<SignStatusMatrix>(word.SSM);
    if (castSsm == SignStatusMatrix::NormalOperation || castSsm == SignStatusMatrix::FunctionalTest) {
      return (static_cast<uint32_t>(word.Data) >> (bit - 1)) & 0x01;
    } else {
      return defaultVal;
    }
  }

  static void setBit(base_arinc_429& word, int bit, bool value) {
    word.Data = static_cast<float>((static_cast<uint32_t>(word.Data) & ~(1 << (bit - 1))) | (value << (bit - 1)));
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_ARINC429_UTILS_HPP
