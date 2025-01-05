// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_ARINC429_HPP
#define FLYBYWIRE_AIRCRAFT_ARINC429_HPP

#include <cstdint>

#include "logging.h"

/**
 * @brief Enum for the ARINC429 Sign Status Matrix
 */
enum Arinc429SignStatus {
  FailureWarning  = 0b00,
  NoComputedData  = 0b01,
  FunctionalTest  = 0b10,
  NormalOperation = 0b11,
};

/**
 * @brief ARINC429 like word representation for use in the FBW systems and the simulator.
 *        It does not implement the full ARINC429 standard but a simplified version of it.<p/>
 *
 * An Arinc429Word consists of a 32 bit data word and a 32 bit Sign Status Matrix (SSM).
 * The data is stored in a template type T, which can be a 32 bit integer or float.
 * The SSM is stored as an unsigned 32 bit integer.<p/>
 *
 * As the simulator only supports 64 bit double values, the data and SSM are encoded into a 64 bit unsigned integer and cast to a double or
 * decoded from a double to the data and SSM.<p/>
 *
 * @tparam T The type of the data (32-bit integer or float)
 */
template <typename T>
class Arinc429Word {
 protected:
  Arinc429Word() = default;

  T        rawData{};
  uint32_t rawSsm{};

 public:
  /**
   * @brief Sets the data and SSM from an arinc429 encoded LVar value (double)
   *
   * The LVar value is casted to a 64 bit unsigned integer and then split into the data (lower 32 bits) and SSM (upper 32 bits).
   *
   * @param simVar An arinc429 encoded LVar value
   */
  void setFromSimVar(double simVar) {
    const auto     u64Val = static_cast<uint64_t>(simVar);
    const uint32_t u32Val = u64Val & 0xffffffff;
    rawSsm                = u64Val >> 32;
    rawData               = *reinterpret_cast<const T*>(&u32Val);
  }

  /**
   * @brief Sets the data and SSM from a data value and an SSM
   * @param data max 32-bit integer or float
   * @param ssm The SSM enum value
   */
  void setFromData(T data, Arinc429SignStatus ssm) {
    // Ensure T is an integer or a float with a maximum size of 32 bits
    static_assert((std::is_integral<T>::value || std::is_floating_point<T>::value), "T must be an integer or a float.");
    static_assert(sizeof(T) <= 4, "T must be at most 32 bits (4 bytes).");

    rawSsm  = ssm;
    rawData = data;
  }

  /**
   * @brief Converts the data and SSM to an arinc429 encoded LVar value (double)
   * @return 64-bit double value representing the arinc429 encoded LVar value
   */
  double toSimVar() {
    const uint64_t u64Val = *reinterpret_cast<const uint32_t*>(&rawData) | static_cast<uint64_t>(rawSsm) << 32;
    return static_cast<double>(u64Val);
  }

  /**
   * @brief Get the SSM enum value
   * @return The SSM enum value
   */
  Arinc429SignStatus ssm() const { return static_cast<Arinc429SignStatus>(rawSsm); }

  /**
   * @brief Set the SSM enum value
   * @param ssm
   */
  void setSsm(Arinc429SignStatus ssm) { rawSsm = static_cast<uint32_t>(ssm); }

  /**
   * @brief Set the data value
   * @param data max 32-bit integer or float
   */
  void setData(T data) {
    // Ensure T is an integer or a float with a maximum size of 32 bits
    static_assert((std::is_integral<T>::value || std::is_floating_point<T>::value), "T must be an integer or a float.");
    static_assert(sizeof(T) <= 4, "T must be at most 32 bits (4 bytes).");

    rawData = data;
  }

  /**
   * @brief Check if the SSM is in the Failure Warning state
   * @return true if the SSM is in the Failure Warning state
   */
  bool isFailureWarning() const { return static_cast<Arinc429SignStatus>(rawSsm) == Arinc429SignStatus::FailureWarning; }

  /**
   * @brief Check if the SSM is in the Normal Operation state
   * @return true if the SSM is in the Normal Operation state
   */
  bool isNormalOperation() const { return static_cast<Arinc429SignStatus>(rawSsm) == Arinc429SignStatus::NormalOperation; }

  /**
   * @brief Get the data value
   * @return The data value
   */
  T value() const { return rawData; }

  /**
   * @brief Get the data value or a default value if the SSM is not in Normal Operation or Functional Test
   * @param defaultVal The default value to return if the SSM is not in Normal Operation or Functional Test
   * @return The data value or the default value
   */
  T valueOr(T defaultVal) const {
    // Ensure T is an integer or a float with a maximum size of 32 bits
    static_assert((std::is_integral<T>::value || std::is_floating_point<T>::value), "T must be an integer or a float.");
    static_assert(sizeof(T) <= 4, "T must be at most 32 bits (4 bytes).");

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

  /**
   * @brief Get the value of a specific bit
   * @param bit The bit number (1-32) to get the value from
   * @return true if the bit is set, false otherwise
   * @throws std::out_of_range if the bit number is out of range if exceptions are enabled. If exceptions are disabled,
   *                           a log message will be printed and the function will return false
   */
  bool bitFromValue(int bit) const {
    if (bit < 1 || bit > 32) {
#ifdef __cpp_exceptions
      throw std::out_of_range("Invalid bit number: " + std::to_string(bit));
#else
      LOG_ERROR("Invalid bit number: " + std::to_string(bit));
      return false;
#endif
    }
    return (static_cast<uint32_t>(rawData) >> (bit - 1)) & 0x01;
  }

  /**
   * @brief Get the value of a specific bit or a default value if the SSM is not in Normal Operation or Functional Test
   * @param bit The bit number (1-32) to get the value from
   * @param defaultVal The default value to return if the SSM is not in Normal Operation or Functional Test
   * @return true if the bit is set, false otherwise
   * @throws std::out_of_range if the bit number is out of range if exceptions are enabled. If exceptions are disabled,
   *                          a log message will be printed and the function will return the default value
   */
  bool bitFromValueOr(int bit, bool defaultVal) const {
    if (bit < 1 || bit > 32) {
#ifdef __cpp_exceptions
      throw std::out_of_range("Invalid bit number: " + std::to_string(bit));
#else
      LOG_ERROR("Invalid bit number: " + std::to_string(bit));
      return defaultVal;
#endif
    }
    if (rawSsm == NormalOperation || rawSsm == FunctionalTest) {
      return bitFromValue(bit);
    } else {
      return defaultVal;
    }
  }

  /**
   * @brief Set the value of a specific bit
   * @param bit The bit number (1-32) to set the value for
   * @param value The boolean value to set the bit to
   * @throws std::out_of_range if the bit number is out of range if exceptions are enabled. If exceptions are disabled,
   *                           a log message will be printed and the function will return
   */
  void setBit(int bit, bool value) {
    if (bit < 1 || bit > 32) {
#ifdef __cpp_exceptions
      throw std::out_of_range("Invalid bit number: " + std::to_string(bit));
#else
      LOG_ERROR("Invalid bit number: " + std::to_string(bit));
#endif
    }
    rawData = static_cast<float>((static_cast<uint32_t>(rawData) & ~(1 << (bit - 1))) | (value << (bit - 1)));
  }
};

/**
 * @brief Arinc429NumericWord uses a float value for the data. These can be used as a numeric value.
 */
class Arinc429NumericWord : public Arinc429Word<float> {
 public:
  /**
   * @brief Construct a new Arinc429NumericWord object
   */
  Arinc429NumericWord() = default;

  /**
   * @brief Construct a new Arinc429NumericWord object based on an arinc429 encoded LVar value
   *
   * @param simVar An arinc429 encoded LVar value
   */
  explicit Arinc429NumericWord(double simVar) { setFromSimVar(simVar); }
};

#endif  // FLYBYWIRE_AIRCRAFT_ARINC429_HPP
