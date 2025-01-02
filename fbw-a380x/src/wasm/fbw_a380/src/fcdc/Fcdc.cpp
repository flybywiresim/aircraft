#include "Fcdc.h"
#include <iostream>

using namespace Arinc429Utils;

Fcdc::Fcdc(bool isUnit1) : isUnit1(isUnit1) {}

FcdcBus Fcdc::update(base_prim_out_bus primsBusOutputs, bool spoilersArmed) {
  FcdcBus output = {};

  LateralLaw systemLateralLaw = getLateralLawStatusFromBits(bitFromValue(primsBusOutputs.fctl_law_status_word, 19),
                                                            bitFromValue(primsBusOutputs.fctl_law_status_word, 20));

  PitchLaw systemPitchLaw = getPitchLawStatusFromBits(bitFromValue(primsBusOutputs.fctl_law_status_word, 16),
                                                      bitFromValue(primsBusOutputs.fctl_law_status_word, 17),
                                                      bitFromValue(primsBusOutputs.fctl_law_status_word, 18));

  output.efcsStatus1.setData(0);
  output.efcsStatus1.setSsm(Arinc429SignStatus::NormalOperation);
  output.efcsStatus1.setBit(11, systemPitchLaw == PitchLaw::NormalLaw);
  output.efcsStatus1.setBit(12, systemPitchLaw == PitchLaw::AlternateLaw1A || systemPitchLaw == PitchLaw::AlternateLaw1B ||
                                    systemPitchLaw == PitchLaw::AlternateLaw1C);
  output.efcsStatus1.setBit(13, systemPitchLaw == PitchLaw::AlternateLaw2);
  output.efcsStatus1.setBit(15, systemPitchLaw == PitchLaw::DirectLaw);
  output.efcsStatus1.setBit(16, systemLateralLaw == LateralLaw::NormalLaw);
  output.efcsStatus1.setBit(17, systemLateralLaw == LateralLaw::DirectLaw);

  output.efcsStatus2.setData(0);
  output.efcsStatus2.setSsm(Arinc429SignStatus::NormalOperation);

  output.efcsStatus3.setData(0);
  output.efcsStatus3.setSsm(Arinc429SignStatus::NormalOperation);
  output.efcsStatus3.setBit(11, bitFromValue(primsBusOutputs.aileron_status_word, 11));
  output.efcsStatus3.setBit(12, bitFromValue(primsBusOutputs.aileron_status_word, 11));
  output.efcsStatus3.setBit(13, bitFromValue(primsBusOutputs.aileron_status_word, 14));
  output.efcsStatus3.setBit(14, bitFromValue(primsBusOutputs.aileron_status_word, 14));
  output.efcsStatus3.setBit(15, bitFromValue(primsBusOutputs.elevator_status_word, 11));
  output.efcsStatus3.setBit(16, bitFromValue(primsBusOutputs.elevator_status_word, 11));
  output.efcsStatus3.setBit(17, bitFromValue(primsBusOutputs.elevator_status_word, 14));
  output.efcsStatus3.setBit(18, bitFromValue(primsBusOutputs.elevator_status_word, 14));
  output.efcsStatus3.setBit(21, bitFromValue(primsBusOutputs.spoiler_status_word, 11));
  output.efcsStatus3.setBit(22, bitFromValue(primsBusOutputs.spoiler_status_word, 11));
  output.efcsStatus3.setBit(23, bitFromValue(primsBusOutputs.spoiler_status_word, 11));
  output.efcsStatus3.setBit(24, bitFromValue(primsBusOutputs.spoiler_status_word, 11));
  output.efcsStatus3.setBit(25, bitFromValue(primsBusOutputs.spoiler_status_word, 11));

  output.efcsStatus4.setData(0);
  output.efcsStatus4.setSsm(Arinc429SignStatus::NormalOperation);
  output.efcsStatus4.setBit(11, valueOr(primsBusOutputs.left_spoiler_1_command_deg, 0) > 0);
  output.efcsStatus4.setBit(12, valueOr(primsBusOutputs.right_spoiler_1_command_deg, 0) > 0);
  output.efcsStatus4.setBit(13, valueOr(primsBusOutputs.left_spoiler_2_command_deg, 0) > 0);
  output.efcsStatus4.setBit(14, valueOr(primsBusOutputs.right_spoiler_2_command_deg, 0) > 0);
  output.efcsStatus4.setBit(15, valueOr(primsBusOutputs.left_spoiler_3_command_deg, 0) > 0);
  output.efcsStatus4.setBit(16, valueOr(primsBusOutputs.right_spoiler_3_command_deg, 0) > 0);
  output.efcsStatus4.setBit(17, valueOr(primsBusOutputs.left_spoiler_4_command_deg, 0) > 0);
  output.efcsStatus4.setBit(18, valueOr(primsBusOutputs.right_spoiler_4_command_deg, 0) > 0);
  output.efcsStatus4.setBit(19, valueOr(primsBusOutputs.left_spoiler_5_command_deg, 0) > 0);
  output.efcsStatus4.setBit(20, valueOr(primsBusOutputs.right_spoiler_5_command_deg, 0) > 0);
  output.efcsStatus4.setBit(21, true);
  output.efcsStatus4.setBit(22, true);
  output.efcsStatus4.setBit(23, true);
  output.efcsStatus4.setBit(24, true);
  output.efcsStatus4.setBit(25, true);
  output.efcsStatus4.setBit(26, valueOr(primsBusOutputs.left_spoiler_1_command_deg, 0) > 10);
  output.efcsStatus4.setBit(27, spoilersArmed);

  output.efcsStatus5.setData(0);
  output.efcsStatus5.setSsm(Arinc429SignStatus::NormalOperation);

  return output;
}

PitchLaw Fcdc::getPitchLawStatusFromBits(bool bit1, bool bit2, bool bit3) {
  if (!bit1 && !bit2 && bit3) {
    return PitchLaw::NormalLaw;
  } else if (!bit1 && bit2 && !bit3) {
    return PitchLaw::AlternateLaw1A;
  } else if (!bit1 && bit2 && bit3) {
    return PitchLaw::AlternateLaw1B;
  } else if (bit1 && !bit2 && !bit3) {
    return PitchLaw::AlternateLaw1C;
  } else if (bit1 && !bit2 && bit3) {
    return PitchLaw::AlternateLaw2;
  } else if (bit1 && bit2 && !bit3) {
    return PitchLaw::DirectLaw;
  } else {
    return PitchLaw::None;
  }
}

LateralLaw Fcdc::getLateralLawStatusFromBits(bool bit1, bool bit2) {
  if (bit1) {
    return LateralLaw::NormalLaw;
  } else if (bit2) {
    return LateralLaw::DirectLaw;
  } else {
    return LateralLaw::None;
  }
}
