#pragma once

#include "FcdcIO.h"

class Fcdc {
 public:
  Fcdc(bool isUnit1);

  void update(double deltaTime, bool faultActive, bool isPowered);

  FcdcBus getBusOutputs();

  FcdcDiscreteOutputs getDiscreteOutputs();

  FcdcDiscreteInputs discreteInputs;

  FcdcBusInputs busInputs;

 private:
  void startup();

  void monitorPowerSupply(double deltaTime, bool isPowered);

  void monitorSelf(bool faultActive);

  void updateSidestickPriorityLightLogic();

  void updateSelfTest(double deltaTime);

  const bool isUnit1;

  bool monitoringHealthy;

  double powerSupplyOutageTime;

  bool powerSupplyFault;

  double selfTestTimer;

  bool selfTestComplete;

  const double minimumPowerOutageTimeForFailure = 0.01;
};
