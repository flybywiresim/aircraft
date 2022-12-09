#include "PulseNode.h"

PulseNode::PulseNode(bool isRisingEdge) : isRisingEdge(isRisingEdge) {}

bool PulseNode::update(bool value) {
  if (output) {
    output = false;
  } else if (isRisingEdge) {
    output = value && !previousInput;
  } else {
    output = !value && previousInput;
  }
  previousInput = value;
  return output;
}

bool PulseNode::getOutput() {
  return output;
}
