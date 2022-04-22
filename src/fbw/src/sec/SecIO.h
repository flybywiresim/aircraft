#pragma once

#include "../busStructures/busStructures.h"

struct SecAnalogInputs {
  // ANI 1-1 - SEC 1&2 only
  double capPitchStickPos;
  // ANI 1-2 - SEC 1&2 only
  double foPitchStickPos;
  // ANI 1-3
  double capRollStickPos;
  // ANI 1-4
  double foRollStickPos;
  // ANI 1-5
  double spdBrkLeverPos;
  // ANI 1-6
  double thrLever1Pos;
  // ANI 1-7
  double thrLever2Pos;
  // ANI 2-1 - SEC 1&2 only
  double leftElevatorPos;
  // ANI 2-2 - SEC 1&2 only
  double rightElevatorPos;
  // ANI 2-3 - SEC 1&2 only
  double thsPos;
  // ANI 2-4
  double leftSpoiler1Pos;
  // ANI 2-5
  double rightSpoiler1Pos;
  // ANI 2-6
  double leftSpoiler2Pos;
  // ANI 2-7
  double rightSpoiler2Pos;
  // ANI 4-1 - SEC 1&2 only
  double loadFactorAcc1;
  // ANI 4-2 - SEC 1&2 only
  double loadFactorAcc2;
  // ANI 6
  double wheelSpeedLeft;
  // ANI 6
  double wheelSpeedRight;
};

struct SecDiscreteInputs {
  // DSI 1
  bool secEngagedFromSwitch;
  // DSI 3 - SEC 1 only
  bool secInemergencyPwrSply;
  // DSI 10 - SEC 1&2 only
  bool pitchNotAvailElac1;
  // DSI 11 - SEC 1&2 only
  bool pitchNotAvailElac2;
  // DSI 13 - SEC 1&2 only
  bool leftElevNotAvailSecOpp;
  // DSI 14
  bool digitalOutputFailedElac1;
  // DSI 15
  bool rightElevNotAvailSecOpp;
  // DSI 17
  bool greenLowPressure;
  // DSI 18
  bool blueLowPressure;
  // DSI 19
  bool yellowLowPressure;
  // DSI 20
  bool sfcc1SlatOut;
  // DSI 20
  bool sfcc2SlatOut;
  // DSI 21 - SEC 1&2 only
  bool digitalOutputFailedElac2;
  // DSI 25 - SEC 1&2 only
  bool thsMotorFault;

  bool lElevServoFailed;

  bool rElevServoFailed;

  bool lSpoiler1ServoFailed;

  bool rSpoiler1ServoFailed;

  bool lSpoiler2ServoFailed;

  bool rSpoiler2ServoFailed;
  // DSI 24
  bool thsOverrideActive;
  // DSI 29
  bool captPriorityTakeoverPressed;
  // DSI 30
  bool foPriorityTakeoverPressed;
};

struct SecAnalogOutputs {
  // ANO 1 - SEC 1&2 only
  double leftElevPosOrder;
  // ANO 2 - SEC 1&2 only
  double rightElevPosOrder;
  // ANO 3 - SEC 1&2 only
  double thsPosOrder;
  // ANO 4
  double leftSpoiler1Order;
  // ANO 5
  double rightSpoiler1Order;
  // ANO 6
  double leftSpoiler2Order;
  // ANO 7
  double rightSpoiler2Order;
};

struct SecDiscreteOutputs {
  // DSO 4 - SEC 1&2 only
  bool thrReverseSelected;
  // DSO 5 - SEC 1&2 only
  bool leftElevOk;
  // DSO 6 - SEC 1&2 only
  bool rightElevOk;
  // DSO 7 - SEC 1&2 only
  bool groundSpoilerOut;
  // DSO 30
  bool secFailed;

  // Relays
  bool leftElevatorDampingMode;

  bool rightElevatorDampingMode;

  bool thsActive;
};

struct SecBusInputs {
  AdirsBusses adirs1;

  AdirsBusses adirs2;

  base_elac_out_bus elac1;

  FcdcBus fcdc1;

  FcdcBus fcdc2;

  base_elac_out_bus elac2;

  SfccBus sfcc1;

  SfccBus sfcc2;

  LgciuBus lgciu1;

  LgciuBus lgciu2;
};
