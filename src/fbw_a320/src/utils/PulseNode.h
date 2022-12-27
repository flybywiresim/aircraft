#pragma once

class PulseNode {
 public:
  PulseNode(bool isRisingEdge);

  bool update(bool value);

  bool getOutput();

 private:
  bool output = false;
  bool previousInput = false;
  bool isRisingEdge;
};
