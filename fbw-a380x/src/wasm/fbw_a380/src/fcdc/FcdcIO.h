#pragma once

#include "../interface/SimConnectData.h"
#include "../model/A380PrimComputer.h"
#include "../model/AutopilotLaws.h"
#include "../model/Autothrust.h"

struct FcdcBus {
  // Label 040
  Arinc429DiscreteWord efcsStatus1;
  // Label 041
  Arinc429DiscreteWord efcsStatus2;
  // Label 042
  Arinc429DiscreteWord efcsStatus3;
  // Label 043
  Arinc429DiscreteWord efcsStatus4;
  // Label 044
  Arinc429DiscreteWord efcsStatus5;

  // similar to fmgcDiscreteWord4, no references available
  Arinc429DiscreteWord primFgDiscreteWord4;

  Arinc429DiscreteWord primFgDiscreteWord8;
};

struct FcdcDiscreteInputs {
  bool spoilersArmed;

  bool noseGearPressed;

  bool primHealthy[3];

  bool otherFcdcHealthy;

  bool btvExitMissed;

  bool fmaModeReversion;

  // Some of these might be bus inputs, no refs though
  bool engineOperative[4];

  bool apuGenConnected;

  bool everyDcSuppliedByTr;

  bool antiskidAvailable;

  bool nwsCommunicationAvailable;

  bool fcuNorthRefTrue;

  /* FIXME use proper bus messages */
  ap_raw_laws_input autopilotStateMachineOutput;
  athr_output autoThrustOutput;
  SimData simData;
};

struct FcdcAnalogInputs {
  double spoilersLeverPos;
};

struct FcdcBusInputs {
  base_prim_out_bus prims[3];
  base_sec_out_bus secs[3];
  base_ra_bus raBusOutputs[3];
  base_arinc_429 fwsDiscreteWord126[2];
};

struct FcdcDiscreteOutputs {
  bool captRedPriorityLightOn;

  bool captGreenPriorityLightOn;

  bool fcdcValid;

  bool foRedPriorityLightOn;

  bool foGreenPriorityLightOn;

  bool autolandWarning;
};
