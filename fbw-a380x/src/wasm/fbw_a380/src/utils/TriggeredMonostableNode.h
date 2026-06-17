#pragma once

class TriggeredMonostableNode {
 public:
  TriggeredMonostableNode(double timeDelay, bool isRisingEdge = true, bool retriggerable = false);

  bool write(bool value, double deltaTime);

  bool read();

 private:
  bool setOutput(bool output);

  bool previousValue = false;
  bool previousOutput = false;
  bool isRisingEdge;
  bool retriggerable;
  double timeConstant = 0;
  double timer = 0;
};
