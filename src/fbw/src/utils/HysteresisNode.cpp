#include "HysteresisNode.h"

HysteresisNode::HysteresisNode(double highTrigger, double lowTrigger) : highTrigger(highTrigger), lowTrigger(lowTrigger) {}

bool HysteresisNode::update(double value) {
  if (!output && value >= highTrigger) {
    output = true;
  } else if (output && value <= lowTrigger) {
    output = false;
  }

  return output;
}

bool HysteresisNode::getOutput() {
  return output;
}
