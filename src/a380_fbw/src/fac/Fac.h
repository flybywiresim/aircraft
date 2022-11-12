#pragma once

#include "../Arinc429Utils.h"
#include "../model/FacComputer.h"
#include "../utils/PulseNode.h"
#include "../utils/SRFlipFlop.h"

class Fac {
 public:
  Fac(bool isUnit1);

  Fac(const Fac&);

  void update(double deltaTime, double simulationTime, bool faultActive, bool isPowered);

  base_fac_bus getBusOutputs();

  base_fac_discrete_outputs getDiscreteOutputs();

  base_fac_analog_outputs getAnalogOutputs();

  FacComputer::ExternalInputs_FacComputer_T modelInputs = {};

 private:
  void initSelfTests();

  void clearMemory();

  void monitorPowerSupply(double deltaTime, bool isPowered);

  void monitorSelf(bool faultActive);

  void updateSelfTest(double deltaTime);

  // Model
  FacComputer facComputer;
  fac_outputs modelOutputs;

  // Computer Self-monitoring vars
  bool facHealthy;

  SRFlipFlop facHealthyFlipFlop = SRFlipFlop(false);

  PulseNode pushbuttonPulse = PulseNode(true);

  // Power Supply monitoring
  double powerSupplyOutageTime;

  bool longPowerFailure;

  bool shortPowerFailure;

  // Selftest vars
  double selfTestTimer;

  bool selfTestComplete;

  // Constants
  const bool isUnit1;

  const double longPowerFailureTime = 0.2;
  const double shortPowerFailureTime = 0.01;
  const double selfTestDuration = 10;
};
