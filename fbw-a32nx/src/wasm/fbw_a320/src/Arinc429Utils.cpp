#include "Arinc429Utils.h"

base_arinc_429 Arinc429Utils::fromSimVar(double simVar) {
  return *reinterpret_cast<base_arinc_429*>(&simVar);
}

double Arinc429Utils::toSimVar(base_arinc_429 word) {
  return *reinterpret_cast<double*>(&word);
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
