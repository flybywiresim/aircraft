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

class Arinc429DiscreteWord : public Arinc429Word<float> {
 public:
  Arinc429DiscreteWord() = default;

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

class Arinc429NumericWord : public Arinc429Word<float> {
 public:
  Arinc429NumericWord() = default;

  explicit Arinc429NumericWord(double simVar) { setFromSimVar(simVar); }
};

// ============================================================================
// Arinc429Word<> specializations
// TODO:are these necessary?
// ============================================================================

template void Arinc429Word<uint32_t>::setFromSimVar(double simVar);
template void Arinc429Word<float>::setFromSimVar(double simVar);

template void Arinc429Word<uint32_t>::setFromData(uint32_t data, Arinc429SignStatus ssm);
template void Arinc429Word<float>::setFromData(float data, Arinc429SignStatus ssm);

template double Arinc429Word<uint32_t>::toSimVar();
template double Arinc429Word<float>::toSimVar();

template Arinc429SignStatus Arinc429Word<uint32_t>::ssm() const;
template Arinc429SignStatus Arinc429Word<float>::ssm() const;

template void Arinc429Word<uint32_t>::setSsm(Arinc429SignStatus ssm);
template void Arinc429Word<float>::setSsm(Arinc429SignStatus ssm);

template void Arinc429Word<uint32_t>::setData(uint32_t data);
template void Arinc429Word<float>::setData(float data);

template bool Arinc429Word<uint32_t>::isFw() const;
template bool Arinc429Word<float>::isFw() const;

template bool Arinc429Word<uint32_t>::isNo() const;
template bool Arinc429Word<float>::isNo() const;

template uint32_t Arinc429Word<uint32_t>::value() const;
template float    Arinc429Word<float>::value() const;

template uint32_t Arinc429Word<uint32_t>::valueOr(uint32_t defaultVal) const;
template float    Arinc429Word<float>::valueOr(float defaultVal) const;

#endif  // FLYBYWIRE_AIRCRAFT_ARINC429_HPP
