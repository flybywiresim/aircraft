#pragma once

class ConfirmNode {
 public:
  ConfirmNode(bool isRisingEdge, double timeDelay);

  bool update(bool value, double deltaTime);

  bool getOutput();

 private:
  bool output = false;
  bool isRisingEdge;
  double timeDelay;
  double timeSinceCondition = 0;
};
