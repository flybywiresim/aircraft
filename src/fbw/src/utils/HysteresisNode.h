#pragma once

class HysteresisNode {
 public:
  HysteresisNode(double highTrigger, double lowTrigger);

  bool update(double value);

  bool getOutput();

 private:
  bool output = false;
  double highTrigger;
  double lowTrigger;
};
