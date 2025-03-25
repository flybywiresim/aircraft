#include "Fcdc.h"
#include <iostream>

using namespace Arinc429Utils;

Fcdc::Fcdc(bool isUnit1) : isUnit1(isUnit1) {}

// Perform the startup sequence, i.e.: Clear the memory, and initialize the self-test sequence.
// If the power supply outage was lower than 3 seconds, or the aircraft is in the air or on ground an moving,
// perform a short self-test.
// Else, perform a long self-test.
void Fcdc::startup() {
  if (powerSupplyOutageTime <= 3.0 || !discreteInputs.noseGearPressed) {
    selfTestTimer = 0.5;
  } else {
    selfTestTimer = 3;
  }
  powerSupplyOutageTime = 0.0;
}

FcdcBus Fcdc::update(double deltaTime, bool faultActive, bool isPowered) {
  monitorPowerSupply(deltaTime, isPowered);

  updateSelfTest(deltaTime);
  monitorSelf(faultActive);

  FcdcBus output = {};

  if (!monitoringHealthy) {
    output.efcsStatus1.setSsm(Arinc429SignStatus::FailureWarning);
    output.efcsStatus2.setSsm(Arinc429SignStatus::FailureWarning);
    output.efcsStatus3.setSsm(Arinc429SignStatus::FailureWarning);
    output.efcsStatus4.setSsm(Arinc429SignStatus::FailureWarning);
    output.efcsStatus5.setSsm(Arinc429SignStatus::FailureWarning);
    return output;
  }

  // Phase 1 of refactoring: Populate FCDC discrete words as per a32nx spec, disregarding the obvious differences.
  // Target: Should behave unsuspiciously in normal ops
  // Select master PRIM, use it for population of FCDC discrete words
  int masterPrim = 0;
  bool allPrimsDead = true;
  for (int i = 0; i < 3; i++) {
    if (discreteInputs.primHealthy[i]) {
      allPrimsDead = false;
      masterPrim = i;
      break;
    }
  }
  Arinc429SignStatus ssm = allPrimsDead ? Arinc429SignStatus::FailureWarning : Arinc429SignStatus::NormalOperation;

  LateralLaw systemLateralLaw = allPrimsDead
                                    ? LateralLaw::DirectLaw
                                    : getLateralLawStatusFromBits(bitFromValue(busInputs.prims[masterPrim].fctl_law_status_word, 19),
                                                                  bitFromValue(busInputs.prims[masterPrim].fctl_law_status_word, 20));

  PitchLaw systemPitchLaw = allPrimsDead ? PitchLaw::DirectLaw
                                         : getPitchLawStatusFromBits(bitFromValue(busInputs.prims[masterPrim].fctl_law_status_word, 16),
                                                                     bitFromValue(busInputs.prims[masterPrim].fctl_law_status_word, 17),
                                                                     bitFromValue(busInputs.prims[masterPrim].fctl_law_status_word, 18));

  output.efcsStatus1.setData(0);
  output.efcsStatus1.setSsm(Arinc429SignStatus::NormalOperation);
  output.efcsStatus1.setBit(11, systemPitchLaw == PitchLaw::NormalLaw);
  output.efcsStatus1.setBit(12, systemPitchLaw == PitchLaw::AlternateLaw1A || systemPitchLaw == PitchLaw::AlternateLaw1B ||
                                    systemPitchLaw == PitchLaw::AlternateLaw1C);
  output.efcsStatus1.setBit(13, systemPitchLaw == PitchLaw::AlternateLaw2);
  output.efcsStatus1.setBit(15, systemPitchLaw == PitchLaw::DirectLaw);
  output.efcsStatus1.setBit(16, systemLateralLaw == LateralLaw::NormalLaw);
  output.efcsStatus1.setBit(17, systemLateralLaw == LateralLaw::DirectLaw);
  output.efcsStatus3.setBit(19, allPrimsDead);
  output.efcsStatus3.setBit(20, allPrimsDead);
  output.efcsStatus3.setBit(21, allPrimsDead);
  output.efcsStatus3.setBit(22, allPrimsDead);
  output.efcsStatus3.setBit(23, allPrimsDead);
  output.efcsStatus3.setBit(24, allPrimsDead);
  output.efcsStatus3.setBit(25, allPrimsDead);
  output.efcsStatus3.setBit(26, allPrimsDead);
  output.efcsStatus3.setBit(29, allPrimsDead);

  output.efcsStatus2.setData(0);
  output.efcsStatus2.setSsm(Arinc429SignStatus::NormalOperation);
  output.efcsStatus2.setBit(11, !bitFromValueOr(busInputs.prims[masterPrim].aileron_status_word, 11, false));
  output.efcsStatus2.setBit(12, !bitFromValueOr(busInputs.prims[masterPrim].aileron_status_word, 11, false));
  output.efcsStatus2.setBit(13, !bitFromValueOr(busInputs.prims[masterPrim].aileron_status_word, 14, false));
  output.efcsStatus2.setBit(14, !bitFromValueOr(busInputs.prims[masterPrim].aileron_status_word, 14, false));
  output.efcsStatus2.setBit(15, !bitFromValueOr(busInputs.prims[masterPrim].elevator_status_word, 11, false));
  output.efcsStatus2.setBit(16, !bitFromValueOr(busInputs.prims[masterPrim].elevator_status_word, 11, false));
  output.efcsStatus2.setBit(17, !bitFromValueOr(busInputs.prims[masterPrim].elevator_status_word, 14, false));
  output.efcsStatus2.setBit(18, !bitFromValueOr(busInputs.prims[masterPrim].elevator_status_word, 14, false));

  output.efcsStatus3.setData(0);
  output.efcsStatus3.setSsm(Arinc429SignStatus::NormalOperation);
  output.efcsStatus3.setBit(11, bitFromValueOr(busInputs.prims[masterPrim].aileron_status_word, 11, false));
  output.efcsStatus3.setBit(12, bitFromValueOr(busInputs.prims[masterPrim].aileron_status_word, 11, false));
  output.efcsStatus3.setBit(13, bitFromValueOr(busInputs.prims[masterPrim].aileron_status_word, 14, false));
  output.efcsStatus3.setBit(14, bitFromValueOr(busInputs.prims[masterPrim].aileron_status_word, 14, false));
  output.efcsStatus3.setBit(15, bitFromValueOr(busInputs.prims[masterPrim].elevator_status_word, 11, false));
  output.efcsStatus3.setBit(16, bitFromValueOr(busInputs.prims[masterPrim].elevator_status_word, 11, false));
  output.efcsStatus3.setBit(17, bitFromValueOr(busInputs.prims[masterPrim].elevator_status_word, 14, false));
  output.efcsStatus3.setBit(18, bitFromValueOr(busInputs.prims[masterPrim].elevator_status_word, 14, false));
  output.efcsStatus3.setBit(21, bitFromValueOr(busInputs.prims[masterPrim].spoiler_status_word, 11, false));
  output.efcsStatus3.setBit(22, bitFromValueOr(busInputs.prims[masterPrim].spoiler_status_word, 11, false));
  output.efcsStatus3.setBit(23, bitFromValueOr(busInputs.prims[masterPrim].spoiler_status_word, 11, false));
  output.efcsStatus3.setBit(24, bitFromValueOr(busInputs.prims[masterPrim].spoiler_status_word, 11, false));
  output.efcsStatus3.setBit(25, bitFromValueOr(busInputs.prims[masterPrim].spoiler_status_word, 11, false));

  output.efcsStatus4.setData(0);
  output.efcsStatus4.setSsm(Arinc429SignStatus::NormalOperation);
  output.efcsStatus4.setBit(11, valueOr(busInputs.prims[masterPrim].left_spoiler_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(12, valueOr(busInputs.prims[masterPrim].right_spoiler_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(13, valueOr(busInputs.prims[masterPrim].left_spoiler_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(14, valueOr(busInputs.prims[masterPrim].right_spoiler_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(15, valueOr(busInputs.prims[masterPrim].left_spoiler_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(16, valueOr(busInputs.prims[masterPrim].right_spoiler_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(17, valueOr(busInputs.prims[masterPrim].left_spoiler_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(18, valueOr(busInputs.prims[masterPrim].right_spoiler_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(19, valueOr(busInputs.prims[masterPrim].left_spoiler_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(20, valueOr(busInputs.prims[masterPrim].right_spoiler_position_deg, 0) < -2.5);
  bool spoilerValid =
      isNo(busInputs.prims[masterPrim].left_spoiler_position_deg) && isNo(busInputs.prims[masterPrim].right_spoiler_position_deg);
  output.efcsStatus4.setBit(21, spoilerValid);
  output.efcsStatus4.setBit(22, spoilerValid);
  output.efcsStatus4.setBit(23, spoilerValid);
  output.efcsStatus4.setBit(24, spoilerValid);
  output.efcsStatus4.setBit(25, spoilerValid);
  output.efcsStatus4.setBit(26, valueOr(busInputs.prims[masterPrim].left_spoiler_position_deg, 0) < -5);
  output.efcsStatus4.setBit(27, discreteInputs.spoilersArmed);

  output.efcsStatus5.setData(0);
  output.efcsStatus5.setSsm(Arinc429SignStatus::NormalOperation);

  return output;
}

// Perform self monitoring
void Fcdc::monitorSelf(bool faultActive) {
  if (faultActive || powerSupplyFault || !selfTestComplete) {
    monitoringHealthy = false;
  } else {
    monitoringHealthy = true;
  }
}

// Monitor the power supply and record the outage time (used for self test and healthy logic).
// If an outage lasts more than 10ms, stop the program execution.
// If the power has been restored after an outage that lasted longer than 10ms, reset the RAM and
// perform the startup sequence.
void Fcdc::monitorPowerSupply(double deltaTime, bool isPowered) {
  if (!isPowered) {
    powerSupplyOutageTime += deltaTime;
  }
  if (powerSupplyOutageTime > minimumPowerOutageTimeForFailure) {
    powerSupplyFault = true;
  }
  if (isPowered && powerSupplyFault) {
    powerSupplyFault = false;
    startup();
  }
}

// Update the Self-test-Sequence
void Fcdc::updateSelfTest(double deltaTime) {
  if (selfTestTimer > 0) {
    selfTestTimer -= deltaTime;
  }
  if (selfTestTimer <= 0) {
    selfTestComplete = true;
  } else {
    selfTestComplete = false;
  }
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
