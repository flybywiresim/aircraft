#pragma once

#include "../Arinc429.h"
#include "../Arinc429Utils.h"
#include "../model/A380PrimComputer.h"

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
};

enum class LateralLaw {
  NormalLaw,
  DirectLaw,
  None,
};

enum class PitchLaw {
  NormalLaw,
  AlternateLaw1A,
  AlternateLaw1B,
  AlternateLaw1C,
  AlternateLaw2,
  DirectLaw,
  None,
};

class Fcdc {
 public:
  Fcdc(bool isUnit1);

  FcdcBus update(base_prim_out_bus primsBusOutputs, bool spoilersArmed);

 private:
  PitchLaw getPitchLawStatusFromBits(bool bit1, bool bit2, bool bit3);

  LateralLaw getLateralLawStatusFromBits(bool bit1, bool bit2);

  const bool isUnit1;
};
