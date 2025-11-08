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

  Arinc429DiscreteWord landingFctDiscreteWord;
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

  bool yellowHydraulicAvailable;

  bool greenHydraulicAvailable;

  bool abnProcImpactingLdgPerfActive;
  bool abnProcImpactingLdgDistActive;

  bool oansFailed;
  bool oansPposLost;

  bool dcEssFailed;
  bool dc2Failed;
  bool ac2Failed;

  bool autoBrakeActive;
  int autoBrakeMode;
  int btvState;

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
  base_ir_bus irBusOutputs[3];
  base_adr_bus adrBusOutputs[3];
  base_sfcc_bus sfccBusOutputs[2];
  base_lgciu_bus lgciuBusOutputs[2];
};

struct FcdcDiscreteOutputs {
  bool captRedPriorityLightOn;

  bool captGreenPriorityLightOn;

  bool fcdcValid;

  bool foRedPriorityLightOn;

  bool foGreenPriorityLightOn;

  bool autolandWarning;

  // This is architecturally not accurate, in the real thing this is done inside the PRIMs.
  // However, as BTV is implemented in Rust and the BTV INOP status is checked here, this would be good place to put it.
  bool btvLost;
};
