#include "ConfirmNode.h"

ConfirmNode::ConfirmNode(bool isRisingEdge, double timeDelay) : isRisingEdge(isRisingEdge), timeDelay(timeDelay) {}

bool ConfirmNode::update(bool value, double deltaTime) {
  bool conditionMet = value == isRisingEdge;

  if (conditionMet) {
    timeSinceCondition += deltaTime;
    output = timeSinceCondition >= timeDelay ? value : output;
  } else {
    timeSinceCondition = 0;
    output = value;
  }
  return output;
}

bool ConfirmNode::getOutput() {
  return output;
}
