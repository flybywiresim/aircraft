#pragma once

#include "../interface/SimConnectData.h"
#include "../model/A380PrimComputerGeneralLogic.h"

struct FcdcBus {
  // F/CTL outputs
  Arinc429DiscreteWord efcsStatus1;

  Arinc429DiscreteWord efcsStatus2;

  Arinc429DiscreteWord efcsStatus3;

  Arinc429DiscreteWord efcsStatus4;

  Arinc429DiscreteWord efcsStatus5;

  Arinc429DiscreteWord efcsStatus6;

  Arinc429DiscreteWord efcsStatus7;

  Arinc429DiscreteWord efcsStatus8;

  Arinc429DiscreteWord efcsStatus9;

  Arinc429DiscreteWord efcsStatus10;

  Arinc429DiscreteWord efcsStatus11;

  Arinc429NumericWord captRollCommand;

  Arinc429NumericWord foRollCommand;

  Arinc429NumericWord rudderPedalPosition;

  Arinc429NumericWord captPitchCommand;

  Arinc429NumericWord foPitchCommand;

  Arinc429NumericWord aileronLeftInnerPos;

  Arinc429NumericWord aileronLeftMiddlePos;

  Arinc429NumericWord aileronLeftOuterPos;

  Arinc429NumericWord aileronRightInnerPos;

  Arinc429NumericWord aileronRightMiddlePos;

  Arinc429NumericWord aileronRightOuterPos;

  Arinc429NumericWord elevatorLeftInnerPos;

  Arinc429NumericWord elevatorLeftOuterPos;

  Arinc429NumericWord elevatorRightInnerPos;

  Arinc429NumericWord elevatorRightOuterPos;

  Arinc429NumericWord horizStabTrimPos;

  Arinc429NumericWord rudderUpperPos;

  Arinc429NumericWord rudderLowerPos;

  Arinc429NumericWord rudderTrimPos;

  Arinc429NumericWord spoilerLeft1Pos;

  Arinc429NumericWord spoilerLeft2Pos;

  Arinc429NumericWord spoilerLeft3Pos;

  Arinc429NumericWord spoilerLeft4Pos;

  Arinc429NumericWord spoilerLeft5Pos;

  Arinc429NumericWord spoilerLeft6Pos;

  Arinc429NumericWord spoilerLeft7Pos;

  Arinc429NumericWord spoilerLeft8Pos;

  Arinc429NumericWord spoilerRight1Pos;

  Arinc429NumericWord spoilerRight2Pos;

  Arinc429NumericWord spoilerRight3Pos;

  Arinc429NumericWord spoilerRight4Pos;

  Arinc429NumericWord spoilerRight5Pos;

  Arinc429NumericWord spoilerRight6Pos;

  Arinc429NumericWord spoilerRight7Pos;

  Arinc429NumericWord spoilerRight8Pos;

  // FG outputs
  Arinc429DiscreteWord fcdcFgDiscreteWord1;

  Arinc429DiscreteWord fcdcFgDiscreteWord2;

  Arinc429DiscreteWord fcdcFgDiscreteWord3;

  Arinc429DiscreteWord landingFctDiscreteWord;
};

struct FcdcDiscreteInputs {
  bool noseGearPressed;

  bool otherFcdcHealthy;

  bool primOff[3];

  bool secOff[3];

  bool btvExitMissed;

  // Some of these might be bus inputs, no refs though
  bool engineOperative[4];

  bool apuGenConnected;

  bool everyDcSuppliedByTr;

  bool antiskidAvailable;

  bool nwsCommunicationAvailable;

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

  // This is architecturally not accurate, in the real thing this is done inside the PRIMs.
  // However, as BTV is implemented in Rust and the BTV INOP status is checked here, this would be good place to put it.
  bool btvLost;
};
