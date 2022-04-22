#pragma once

#include "../busStructures/busStructures.h"

struct FacAnalogInputs {
  double yawDamperPosition;

  double rudderTrimPosition;

  double rudderTravelLimPosition;
};

struct FacDiscreteInputs {
  bool apOwnEngaged;

  bool apOppEngaged;

  bool yawDamperOppEngaged;

  bool rudderTrimOppEngaged;

  bool rudderTravelLimOppEngaged;

  bool elac1Healthy;

  bool elac2Healthy;

  bool engine1Stopped;

  bool engine2Stopped;

  bool rudderTrimSwitchLeft;

  bool rudderTrimSwitchRight;

  bool rudderTrimButtonReset;

  bool facEngagedFromSwitch;

  bool rudderTrimActuatorHealthy;

  bool rudderTravelLimActuatorHealthy;

  bool slatsExtended;

  bool noseGearPressed;

  bool ir3Switch;

  bool adr3Switch;

  bool yawDamperHasHydPress;
};

struct FacAnalogOutputs {
  double yawDamperOrder;

  double rudderTrimOrder;

  double rudderTravelLimOrder;
};

struct FacDiscreteOutputs {
  bool facHealthy;

  bool yawDamperEngaged;

  bool rudderTrimEngaged;

  bool rudderTravelLimEngaged;

  bool yawDamperNormalLawAvail;
};

struct FacBusInputs {
  FacBus facOpp;

  FmgcABus fmgcOwn;

  FmgcABus fmgcOpp;

  AdirsBusses adirsOwn;

  AdirsBusses adirsOpp;

  AdirsBusses adirs3;

  base_elac_out_bus elac1;

  base_elac_out_bus elac2;

  SfccBus sfccOwn;

  LgciuBus lgciuOwn;
};
