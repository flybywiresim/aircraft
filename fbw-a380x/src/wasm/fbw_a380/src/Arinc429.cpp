#include "Arinc429.h"

template <typename T>
Arinc429Word<T>::Arinc429Word() {}

template <typename T>
void Arinc429Word<T>::setFromSimVar(double simVar) {
  const auto u64Val = static_cast<uint64_t>(simVar);
  const uint32_t u32Val = u64Val & 0xffffffff;
  rawSsm = u64Val >> 32;
  rawData = *reinterpret_cast<const T*>(&u32Val);
}
template void Arinc429Word<uint32_t>::setFromSimVar(double simVar);
template void Arinc429Word<float>::setFromSimVar(double simVar);

template <typename T>
void Arinc429Word<T>::setFromData(T data, Arinc429SignStatus ssm) {
  rawSsm = ssm;
  rawData = data;
}
template void Arinc429Word<uint32_t>::setFromData(uint32_t data, Arinc429SignStatus ssm);
template void Arinc429Word<float>::setFromData(float data, Arinc429SignStatus ssm);

template <typename T>
double Arinc429Word<T>::toSimVar() {
  const uint64_t u64Val = *reinterpret_cast<const uint32_t*>(&rawData) | static_cast<uint64_t>(rawSsm) << 32;
  return static_cast<double>(u64Val);
}
template double Arinc429Word<uint32_t>::toSimVar();
template double Arinc429Word<float>::toSimVar();

template <typename T>
Arinc429SignStatus Arinc429Word<T>::ssm() const {
  return static_cast<Arinc429SignStatus>(rawSsm);
}
template Arinc429SignStatus Arinc429Word<uint32_t>::ssm() const;
template Arinc429SignStatus Arinc429Word<float>::ssm() const;

template <typename T>
void Arinc429Word<T>::setSsm(Arinc429SignStatus ssm) {
  rawSsm = static_cast<uint32_t>(ssm);
}
template void Arinc429Word<uint32_t>::setSsm(Arinc429SignStatus ssm);
template void Arinc429Word<float>::setSsm(Arinc429SignStatus ssm);

template <typename T>
void Arinc429Word<T>::setData(T data) {
  rawData = data;
}
template void Arinc429Word<uint32_t>::setData(uint32_t data);
template void Arinc429Word<float>::setData(float data);

template <typename T>
bool Arinc429Word<T>::isFw() const {
  return static_cast<Arinc429SignStatus>(rawSsm) == Arinc429SignStatus::FailureWarning;
}
template bool Arinc429Word<uint32_t>::isFw() const;
template bool Arinc429Word<float>::isFw() const;

template <typename T>
bool Arinc429Word<T>::isNo() const {
  return static_cast<Arinc429SignStatus>(rawSsm) == Arinc429SignStatus::NormalOperation;
}
template bool Arinc429Word<uint32_t>::isNo() const;
template bool Arinc429Word<float>::isNo() const;

template <typename T>
T Arinc429Word<T>::value() const {
  return rawData;
}
template uint32_t Arinc429Word<uint32_t>::value() const;
template float Arinc429Word<float>::value() const;

template <typename T>
T Arinc429Word<T>::valueOr(T defaultVal) const {
  if (rawSsm == NormalOperation || rawSsm == FunctionalTest) {
    return rawData;
  } else {
    return defaultVal;
  }
}
template uint32_t Arinc429Word<uint32_t>::valueOr(uint32_t defaultVal) const;
template float Arinc429Word<float>::valueOr(float defaultVal) const;

Arinc429DiscreteWord::Arinc429DiscreteWord() {}

bool Arinc429DiscreteWord::bitFromValue(int bit) const {
  return (static_cast<uint32_t>(rawData) >> (bit - 1)) & 0x01;
}

bool Arinc429DiscreteWord::bitFromValueOr(int bit, bool defaultVal) const {
  if (rawSsm == NormalOperation || rawSsm == FunctionalTest) {
    return (static_cast<uint32_t>(rawData) >> (bit - 1)) & 0x01;
  } else {
    return defaultVal;
  }
}

void Arinc429DiscreteWord::setBit(int bit, bool value) {
  rawData = static_cast<float>((static_cast<uint32_t>(rawData) & ~(1 << (bit - 1))) | (value << (bit - 1)));
}

Arinc429NumericWord::Arinc429NumericWord() {}
