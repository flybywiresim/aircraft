#pragma once

#include <cstdint>

namespace types {

enum Arinc429SignStatus {
  FailureWarning = 0b00,
  NoComputedData = 0b01,
  FunctionalTest = 0b10,
  NormalOperation = 0b11,
};

template <typename T>
class Arinc429Word {
 protected:
  std::uint32_t _rawSsm;
  T _rawData;

 public:
  Arinc429Word() : _rawSsm(0), _rawData() {}

  double toSimVar() const { return *reinterpret_cast<double*>(this); }

  Arinc429SignStatus ssm() const { return static_cast<Arinc429SignStatus>(this->_rawSsm); }

  void setSsm(Arinc429SignStatus ssm) { this->_rawSsm = ssm; }

  void setData(T data) { this->_rawData = data; }

  bool isFw() const { return static_cast<Arinc429SignStatus>(this->_rawSsm) == Arinc429SignStatus::FailureWarning; }

  bool isNo() const { return static_cast<Arinc429SignStatus>(this->_rawSsm) == Arinc429SignStatus::NormalOperation; }

  const T& value() const { return this->_rawData; }

  const T& valueOr(const T& defaultVal) const {
    if (this->isNo()) {
      return this->_rawData;
    } else {
      return defaultVal;
    }
  }

  static Arinc429Word<T> fromSimVar(double simVar) {
    Arinc429Word<T> convertedWord = *reinterpret_cast<Arinc429Word<T>*>(&simVar);
    return std::move(convertedWord);
  }

  static Arinc429Word<T> fromData(T data, Arinc429SignStatus ssm) {
    Arinc429Word<T> retval;
    retval._rawSsm = ssm;
    retval._rawData = data;
    return std::move(retval);
  }
};

}  // namespace types
