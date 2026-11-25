#pragma once

struct BcmDiscreteInputs {
  bool prim1Inhibit;

  bool sec1Inhibit;

  bool prim3Inhibit;

  bool sec3Inhibit;

  bool pitchTrimUpPressed;

  bool pitchTrimDownPressed;
};

struct BcmDiscreteOutputs {
  bool bcmEnergized;

  bool bcmActive;
};

struct BcmAnalogInputs {
  double captPitchStickPos;

  double foPitchStickPos;

  double captRollStickPos;

  double foRollStickPos;

  double rudderPedalPos;

  // Internal gyros
  double pitchRate;

  double yawRate;
};

struct BcmAnalogOutputs {
  double leftElevCmd;

  double rightElevCmd;

  double leftAilCmd;

  double rightAilCmd;

  double upperRudCmd;

  double lowerRudCmd;

  double thsRateCmd;
};
