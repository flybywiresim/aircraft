
// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_FINGERPRINT_HPP
#define FLYBYWIRE_AIRCRAFT_FINGERPRINT_HPP

#include <cstdint>
#include <vector>

/**
 * This class provides a fingerprint function for vectors of values.
 */
class Fingerprint {
 public:
  /**
   * Fowler-Noll-Vo hash function
   * @tparam T the type of the values in the provided vector
   * @param vec the vector of values to hash
   * @return the hash value
   */
  template <typename T>
  static uint64_t fingerPrintFVN(const std::vector<T>& vec) {
    const uint64_t FNV_OFFSET_BASIS = 0xcbf29ce484222325ULL;
    const uint64_t FNV_PRIME        = 0x100000001b3ULL;
    uint64_t       fp               = 0;
    for (const auto& elem : vec) {
      const T&             value = elem;
      uint64_t             hash  = FNV_OFFSET_BASIS;
      const unsigned char* bytes = reinterpret_cast<const unsigned char*>(&value);
      for (size_t i = 0; i < sizeof(T); i++) {
        hash ^= static_cast<uint64_t>(bytes[i]);
        hash *= FNV_PRIME;
      }
      uint64_t h = hash;
      fp ^= h;
      fp *= FNV_PRIME;
    }
    return fp;
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_FINGERPRINT_HPP
