// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_ARINC429_HPP
#define FLYBYWIRE_AIRCRAFT_ARINC429_HPP

#include <cstdint>

#include "elac_computer_types.h"

enum Arinc429SignStatus {
  FailureWarning  = 0b00,
  NoComputedData  = 0b01,
  FunctionalTest  = 0b10,
  NormalOperation = 0b11,
};

/**
 * @brief Arinc429Word class
 * @tparam T
 *
 * TODO: document this properly
 */
template <typename T>
class Arinc429Word {
 protected:
  Arinc429Word() = default;

  uint32_t rawSsm{};

  T rawData{};

 public:
  void setFromSimVar(double simVar) {
    const auto     u64Val = static_cast<uint64_t>(simVar);
    const uint32_t u32Val = u64Val & 0xffffffff;
    rawSsm                = u64Val >> 32;
    rawData               = *reinterpret_cast<const T*>(&u32Val);
  }

  void setFromData(T data, Arinc429SignStatus ssm) {
    rawSsm  = ssm;
    rawData = data;
  }

  double toSimVar() {
    const uint64_t u64Val = *reinterpret_cast<const uint32_t*>(&rawData) | static_cast<uint64_t>(rawSsm) << 32;
    return static_cast<double>(u64Val);
  }

  Arinc429SignStatus ssm() const { return static_cast<Arinc429SignStatus>(rawSsm); }

  void setSsm(Arinc429SignStatus ssm) { rawSsm = static_cast<uint32_t>(ssm); }

  void setData(T data) { rawData = data; }

  bool isFw() const { return static_cast<Arinc429SignStatus>(rawSsm) == Arinc429SignStatus::FailureWarning; }

  bool isNo() const { return static_cast<Arinc429SignStatus>(rawSsm) == Arinc429SignStatus::NormalOperation; }

  T value() const { return rawData; }

  T valueOr(T defaultVal) const {
    if (rawSsm == NormalOperation || rawSsm == FunctionalTest) {
      return rawData;
    } else {
      return defaultVal;
    }
  }
};

/**
 * @brief Arinc429DiscreteWord uses bit level encoding of the data. These cannot be used as a numeric value.
 */
class Arinc429DiscreteWord : public Arinc429Word<float> {
 public:
  /**
   * @brief Construct a new Arinc429DiscreteWord object
   */
  Arinc429DiscreteWord() = default;

  /**
   * @brief Construct a new Arinc429DiscreteWord object
   *
   * @param simVar An arinc429 encoded LVar value
   */
  explicit Arinc429DiscreteWord(double simVar) { setFromSimVar(simVar); }

  bool bitFromValue(int bit) const { return (static_cast<uint32_t>(rawData) >> (bit - 1)) & 0x01; }

  bool bitFromValueOr(int bit, bool defaultVal) const {
    if (rawSsm == NormalOperation || rawSsm == FunctionalTest) {
      return (static_cast<uint32_t>(rawData) >> (bit - 1)) & 0x01;
    } else {
      return defaultVal;
    }
  }

  void setBit(int bit, bool value) {
    rawData = static_cast<float>((static_cast<uint32_t>(rawData) & ~(1 << (bit - 1))) | (value << (bit - 1)));
  }
};

/**
 * @brief Arinc429NumericWord uses numeric encoding of the data
 */
class Arinc429NumericWord : public Arinc429Word<float> {
 public:
  /**
   * @brief Construct a new Arinc429NumericWord object
   */
  Arinc429NumericWord() = default;

  /**
   * @brief Construct a new Arinc429NumericWord object
   *
   * @param simVar An arinc429 encoded LVar value
   */
  explicit Arinc429NumericWord(double simVar) { setFromSimVar(simVar); }
};

#endif  // FLYBYWIRE_AIRCRAFT_ARINC429_HPP
