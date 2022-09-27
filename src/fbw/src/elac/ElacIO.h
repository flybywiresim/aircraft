#pragma once

#include "../busStructures/busStructures.h"

struct ElacAnalogInputs {
  // ANI 1-1
  double capPitchStickPos;
  // ANI 1-2
  double foPitchStickPos;
  // ANI 1-3
  double capRollStickPos;
  // ANI 1-4
  double foRollStickPos;
  // ANI 2-1
  double leftElevatorPos;
  // ANI 2-2
  double rightElevatorPos;
  // ANI 2-3
  double thsPos;
  // ANI 2-4
  double leftAileronPos;
  // ANI 2-5
  double rightAileronPos;
  // ANI 2-6
  double rudderPedalPos;
  // ANI 4-1
  double loadFactorAcc1;
  // ANI 4-2
  double loadFactorAcc2;
  // ANI 4-3
  double blueHydPressure;
  // ANI 4-4
  double greenHydPressure;
  // ANI 4-5
  double yellowHydPressure;
};

struct ElacDiscreteInputs {
  // DSI 3
  bool groundSpoilersActive1;
  // DSI 3
  bool groundSpoilersActive2;
  // DSI 6
  bool oppPitchAxisFailure;
  // DSI 7
  bool ap1Disengaged;
  // DSI 10
  bool ap2Disengaged;
  // DSI 11
  bool oppLeftAileronLost;
  // DSI 14
  bool oppRightAileronLost;
  // DSI 15
  bool fac1YawControlLost;
  // DSI 16
  bool lgciu1NoseGearPressed;
  // DSI 16
  bool lgciu2NoseGearPressed;
  // DSI 18
  bool fac2YawControlLost;
  // DSI 19
  bool lgciu1RightMainGearPressed;
  // DSI 19
  bool lgciu2RightMainGearPressed;
  // DSI 21
  bool lgciu1LeftMainGearPressed;
  // DSI 21
  bool lgciu2LeftMainGearPressed;
  // DSI 24
  bool thsMotorFault;
  // DSI 26
  bool sfcc1SlatsOut;
  // DSI 26
  bool sfcc2SlatsOut;
  // DSI 27
  bool lAilServoFailed;
  // DSI 27
  bool lElevServoFailed;
  // DSI 28
  bool rAilServoFailed;
  // DSI 28
  bool rElevServoFailed;
  // DSI 31
  bool thsOverrideActive;
  // DSI 32
  bool yellowLowPressure;
  // DSI 35
  bool captPriorityTakeoverPressed;
  // DSI 36
  bool foPriorityTakeoverPressed;
  // DSI 40
  bool blueLowPressure;
  // DSI 42
  bool greenLowPressure;
  // DSI 50
  bool elacEngagedFromSwitch;
  // DSI 53
  bool normalPowersupplyLost;
};

struct ElacAnalogOutputs {
  // ANO 1
  double leftElevPosOrder;
  // ANO 2
  double rightElevPosOrder;
  // ANO 3
  double thsPosOrder;
  // ANO 4
  double leftAileronPosOrder;
  // ANO 5
  double rightAileronPosOrder;
};

struct ElacDiscreteOutputs {
  // DSO 1
  bool pitchAxisOk;
  // DSO 2
  bool leftAileronOk;
  // DSO 3
  bool rightAileronOk;
  // DSO 6
  bool digitalOperationValidated;
  // DSO 7
  bool ap1Authorised;
  // DSO 8
  bool ap2Authorised;

  // Relays
  // K5-1
  bool leftAileronActiveMode;
  // K4-1
  bool rightAileronActiveMode;

  bool leftElevatorDampingMode;

  bool rightElevatorDampingMode;

  bool thsActive;
};

struct ElacBusInputs {
  AdirsBusses adirs1;

  AdirsBusses adirs2;

  AdirsBusses adirs3;

  FmgcABus fmgc1;

  FmgcABus fmgc2;

  RaBus ra1;

  RaBus ra2;

  SfccBus sfcc1;

  SfccBus sfcc2;

  FcdcBus fcdc1;

  FcdcBus fcdc2;

  SecOutBus sec1;

  SecOutBus sec2;

  ElacOutBus elacOpp;
};
