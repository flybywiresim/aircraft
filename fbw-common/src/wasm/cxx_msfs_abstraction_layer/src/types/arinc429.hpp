#pragma once

#include <cstdint>

namespace types {

/**
 * @brief Defines the different status flags
 */
enum Arinc429SignStatus {
  FailureWarning = 0b00,
  NoComputedData = 0b01,
  FunctionalTest = 0b10,
  NormalOperation = 0b11,
};

/**
 * @brief Arinc 429 standard word
 * @tparam T Type of the word
 */
template <typename T>
class Arinc429Word {
 protected:
  std::uint32_t _rawSsm;
  T _rawData;

 public:
  /**
   * @brief Construct a new Arinc 429 Word object
   */
  Arinc429Word() : _rawSsm(0), _rawData() {}

  /**
   * @brief Converts the word to a value that can be used to communicate with the simulator
   * @return double The resulting value
   */
  double toSimVar() const { return *reinterpret_cast<double*>(this); }

  /**
   * @brief Returns the status flag
   * @return Arinc429SignStatus The current status flag
   */
  Arinc429SignStatus ssm() const { return static_cast<Arinc429SignStatus>(this->_rawSsm); }

  /**
   * @brief Set the Ssm object
   * @param ssm The new sign status
   */
  void setSsm(Arinc429SignStatus ssm) { this->_rawSsm = ssm; }

  /**
   * @brief Set the data object
   * @param data The new value for the object
   */
  void setData(T data) { this->_rawData = data; }

  /**
   * @brief Checks if the word is flagged as a failure or warning
   * @return true if it is flagged as failure or warning
   * @return false if it is not flagged as failure or warning
   */
  bool isFw() const { return static_cast<Arinc429SignStatus>(this->_rawSsm) == Arinc429SignStatus::FailureWarning; }

  /**
   * @brief Checks if the word is flagged as a normal operation
   * @return true if it is flagged as normal operation
   * @return false if it is not flagged as normal operation
   */
  bool isNo() const { return static_cast<Arinc429SignStatus>(this->_rawSsm) == Arinc429SignStatus::NormalOperation; }

  /**
   * @brief Returns the constant reference to the value
   * @return const T& The constant reference to the value
   */
  const T& value() const { return this->_rawData; }

  /**
   * @brief Returns the value if it is flagged as normal operation, else the default value
   * @param defaultVal The default value
   * @return const T& The constant reference to the value or default value
   */
  const T& valueOr(const T& defaultVal) const {
    if (this->isNo()) {
      return this->_rawData;
    } else {
      return defaultVal;
    }
  }

  /**
   * @brief Converts a simulator value to the Arinc 429 word
   * @param simVar The simulator value
   * @return Arinc429Word<T> The new word definition
   */
  static Arinc429Word<T> fromSimVar(double simVar) {
    const auto qWord = static_cast<std::uint64_t>(simVar);
    const auto lowerDWord = static_cast<std::uint32_t>(qWord & 0xffffffff);

    Arinc429Word<T> convertedWord;
    convertedWord._rawSsm = static_cast<std::uint32_t>(qWord >> 32);
    convertedWord._rawData = *reinterpret_cast<const T*>(&lowerDWord);
    return std::move(convertedWord);
  }

  /**
   * @brief Converts a simulator value to the Arinc 429 word
   * @param simVar The simulator value
   * @return Arinc429Word<T> The new word definition
   */
  static Arinc429Word<T> fromSimVar(double simVar, const T& factor) {
    Arinc429Word<float> convertedWord = Arinc429Word<float>::fromSimVar(simVar);

    Arinc429Word<T> word;
    word.setData(convertedWord.value() * factor);
    word.setSsm(convertedWord.ssm());

    return std::move(word);
  }

  /**
   * @brief Creates an Arinc 429 word
   * @param data The value of the word
   * @param ssm The sign status
   * @return Arinc429Word<T> The resulting word
   */
  static Arinc429Word<T> fromData(T data, Arinc429SignStatus ssm) {
    Arinc429Word<T> retval;
    retval._rawSsm = ssm;
    retval._rawData = data;
    return std::move(retval);
  }
};

}  // namespace types
