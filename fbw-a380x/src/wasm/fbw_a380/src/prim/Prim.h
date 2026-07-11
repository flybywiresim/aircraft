#pragma once

#include "../interface/SimConnectInterface.h"
#include "../model/A380PrimComputerFctl.h"
#include "../model/A380PrimComputerFe.h"
#include "../model/A380PrimComputerGeneralLogic.h"
#include "../utils/ConfirmNode.h"
#include "../utils/HysteresisNode.h"
#include "../utils/PulseNode.h"
#include "../utils/SRFlipFlop.h"

class Prim {
 public:
  Prim(bool isUnit1, bool isUnit2, bool isUnit3);

  Prim(const Prim&);

  void update(double deltaTime,
              double simulationTime,
              bool faultActive,
              bool isPowered,
              SimConnectInterface& simConnectInterface,
              bool generalLogicDisabled,
              bool fctlDisabled,
              bool feDisabled);

  base_prim_out_bus getBusOutputs();

  base_prim_discrete_outputs getDiscreteOutputs();

  base_prim_analog_outputs getAnalogOutputs();

  A380PrimComputerGeneralLogic::ExternalInputs_A380PrimComputerGeneralLogic_T& externalInputs();

 private:
  void initSelfTests(bool viaPushButton);

  void clearMemory();

  void monitorButtonStatus();

  void monitorPowerSupply(double deltaTime, bool isPowered);

  void monitorSelf(bool faultActive);

  void updateSelfTest(double deltaTime);

  // Model
  A380PrimComputerGeneralLogic primGeneralLogic;
  A380PrimComputerFctl primFctl;
  A380PrimComputerFe primFe;

  // Computer Self-monitoring vars
  bool monitoringHealthy;

  bool selfTestFaultLightVisible;

  bool prevEngageButtonWasPressed;

  // Power Supply monitoring
  double powerSupplyOutageTime;

  bool powerSupplyFault;

  // Selftest vars
  double selfTestTimer;

  bool selfTestComplete;

  // Constants
  const bool isUnit1;
  const bool isUnit2;
  const bool isUnit3;

  const double minimumPowerOutageTimeForFailure = 0.02;
  const double shortSelfTestDuration = 1;
  const double longSelfTestDuration = 36;
};
