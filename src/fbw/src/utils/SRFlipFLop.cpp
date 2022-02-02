#include "SRFlipFlop.h"

SRFlipFlop::SRFlipFlop(bool hasSetPrecedence) : hasSetPrecedence(hasSetPrecedence) {}

bool SRFlipFlop::update(bool set, bool reset) {
  if (set && reset) {
    output = hasSetPrecedence;
  } else if (set) {
    output = true;
  } else if (reset) {
    output = false;
  }
  return output;
}

bool SRFlipFlop::getOutput() {
  return output;
}
