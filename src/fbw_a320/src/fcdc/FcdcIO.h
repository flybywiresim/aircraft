#pragma once

#include "../busStructures/busStructures.h"

struct FcdcDiscreteInputs {
  bool elac1Off;

  bool elac1Valid;

  bool elac2Valid;

  bool sec1Off;

  bool sec1Valid;

  bool sec2Valid;

  bool eng1NotOnGroundAndNotLowOilPress;

  bool eng2NotOnGroundAndNotLowOilPress;

  bool noseGearPressed;

  bool oppFcdcFailed;

  bool sec3Off;

  bool sec3Valid;

  bool elac2Off;

  bool sec2Off;
};

struct FcdcDiscreteOutputs {
  bool captRedPriorityLightOn;

  bool captGreenPriorityLightOn;

  bool fcdcValid;

  bool foRedPriorityLightOn;

  bool foGreenPriorityLightOn;
};

struct FcdcBusInputs {
  base_elac_out_bus elac1;

  base_sec_out_bus sec1;

  base_fcdc_bus fcdcOpp;

  base_elac_out_bus elac2;

  base_sec_out_bus sec2;

  base_sec_out_bus sec3;
};
