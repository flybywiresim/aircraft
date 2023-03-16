#include "Arinc429Utils.h"

base_arinc_429 Arinc429Utils::fromSimVar(double simVar) {
  base_arinc_429 ret;
  const auto u64Val = static_cast<uint64_t>(simVar);
  const uint32_t u32Val = u64Val & 0xffffffff;
  ret.SSM = u64Val >> 32;
  ret.Data = *reinterpret_cast<const float*>(&u32Val);
  return ret;
}

double Arinc429Utils::toSimVar(base_arinc_429 word) {
  const uint64_t u64Val = *reinterpret_cast<const uint32_t*>(&word.Data) | static_cast<uint64_t>(word.SSM) << 32;
  return static_cast<double>(u64Val);
}

bool Arinc429Utils::isFw(base_arinc_429 word) {
  return static_cast<SignStatusMatrix>(word.SSM) == SignStatusMatrix::FailureWarning;
}

bool Arinc429Utils::isNo(base_arinc_429 word) {
  return static_cast<SignStatusMatrix>(word.SSM) == SignStatusMatrix::NormalOperation;
}

float Arinc429Utils::valueOr(base_arinc_429 word, float defaultVal) {
  auto castSsm = static_cast<SignStatusMatrix>(word.SSM);
  if (castSsm == SignStatusMatrix::NormalOperation || castSsm == SignStatusMatrix::FunctionalTest) {
    return word.Data;
  } else {
    return defaultVal;
  }
}

bool Arinc429Utils::bitFromValue(base_arinc_429 word, int bit) {
  return (static_cast<uint32_t>(word.Data) >> (bit - 1)) & 0x01;
}

bool Arinc429Utils::bitFromValueOr(base_arinc_429 word, int bit, bool defaultVal) {
  auto castSsm = static_cast<SignStatusMatrix>(word.SSM);
  if (castSsm == SignStatusMatrix::NormalOperation || castSsm == SignStatusMatrix::FunctionalTest) {
    return (static_cast<uint32_t>(word.Data) >> (bit - 1)) & 0x01;
  } else {
    return defaultVal;
  }
}

void Arinc429Utils::setBit(base_arinc_429& word, int bit, bool value) {
  word.Data = static_cast<float>((static_cast<uint32_t>(word.Data) & ~(1 << (bit - 1))) | (value << (bit - 1)));
}
