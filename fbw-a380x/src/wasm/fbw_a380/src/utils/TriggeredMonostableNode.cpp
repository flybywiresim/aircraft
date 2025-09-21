#include <cmath>
#include <iostream>

#include "TriggeredMonostableNode.h"

TriggeredMonostableNode::TriggeredMonostableNode(double timeConstant, bool isRisingEdge, bool retriggerable)
    : isRisingEdge(isRisingEdge), timeConstant(timeConstant), retriggerable(retriggerable), previousValue(!isRisingEdge) {}

bool TriggeredMonostableNode::setOutput(bool output) {
  previousOutput = output;
  return output;
}

bool TriggeredMonostableNode::write(bool value, double deltaTime) {
  if (timer > 0) {
    timer = std::max(0.0, timer - deltaTime);
  }

  if ((retriggerable || timer == 0) && ((isRisingEdge && value && !previousValue) || (!isRisingEdge && !value && previousValue))) {
    timer = timeConstant;
  }

  previousValue = value;
  return setOutput(timer > 0);
}

bool TriggeredMonostableNode::read() {
  return previousOutput;
}
