#pragma once

#include <cstdint>

enum Arinc429SignStatus {
  FailureWarning = 0b00,
  NoComputedData = 0b01,
  FunctionalTest = 0b10,
  NormalOperation = 0b11,
};

template <typename T>
class Arinc429Word {
 protected:
  Arinc429Word();

  uint32_t rawSsm;

  T rawData;

 public:
  void setFromSimVar(double simVar);

  void setFromData(T data, Arinc429SignStatus ssm);

  double toSimVar();

  Arinc429SignStatus ssm() const;

  void setSsm(Arinc429SignStatus ssm);

  void setData(T data);

  bool isFw() const;

  bool isNo() const;

  T value() const;

  T valueOr(T defaultVal) const;
};

class Arinc429DiscreteWord : public Arinc429Word<float> {
 public:
  Arinc429DiscreteWord();

  bool bitFromValue(int bit) const;

  bool bitFromValueOr(int bit, bool defaultVal) const;

  void setBit(int bit, bool value);
};

class Arinc429NumericWord : public Arinc429Word<float> {
 public:
  Arinc429NumericWord();
};
