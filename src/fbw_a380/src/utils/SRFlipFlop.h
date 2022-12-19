#pragma once

class SRFlipFlop {
 public:
  SRFlipFlop(bool hasSetPrecedence);

  bool update(bool set, bool reset);

  bool getOutput();

 private:
  bool output = false;

  const bool hasSetPrecedence;
};
