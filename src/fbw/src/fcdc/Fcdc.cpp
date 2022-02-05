#include "Fcdc.h"
#include <iostream>

Fcdc::Fcdc(bool isUnit1) : isUnit1(isUnit1) {}

// Perform the startup sequence, i.e.: Clear the memory, and initialize the self-test sequence.
// If the power supply outage was lower than 3 seconds, or the aircraft is in the air or on ground an moving,
// perform a short self-test.
// Else, perform a long self-test.
void Fcdc::startup() {
  if (powerSupplyOutageTime <= 3.0 || (!discreteInputs.noseGearPressed && !discreteInputs.eng1NotOnGroundAndNotLowOilPress &&
                                       !discreteInputs.eng2NotOnGroundAndNotLowOilPress)) {
    selfTestTimer = 0.5;
  } else {
    selfTestTimer = 3;
  }
  powerSupplyOutageTime = 0.0;
}

// Main update cycle
void Fcdc::update(double deltaTime, bool faultActive, bool isPowered) {
  monitorPowerSupply(deltaTime, isPowered);

  updateSelfTest(deltaTime);
  monitorSelf(faultActive);

  if (monitoringHealthy) {
    computeActiveSystemLaws();
  }
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

LateralLaw Fcdc::getLateralLawStatusFromBits(bool bit1, bool bit2, bool bit3) {
  if (bit1) {
    return LateralLaw::NormalLaw;
  } else if (bit2) {
    return LateralLaw::DirectLaw;
  } else {
    return LateralLaw::None;
  }
}

PitchLaw Fcdc::getPitchLawStatusFromBits(bool bit1, bool bit2, bool bit3) {
  if (bit1 && !bit2 && !bit3) {
    return PitchLaw::NormalLaw;
  } else if (!bit1 && bit2 && !bit3) {
    return PitchLaw::AlternateLaw1;
  } else if (bit1 && bit2 && !bit3) {
    return PitchLaw::AlternateLaw2;
  } else if (!bit1 && !bit2 && bit3) {
    return PitchLaw::DirectLaw;
  } else {
    return PitchLaw::None;
  }
}

void Fcdc::computeActiveSystemLaws() {
  bool elac1EngagedInRoll = busInputs.elac1.discreteStatusWord1.bitFromValueOr(20, false);
  bool elac2EngagedInRoll = busInputs.elac2.discreteStatusWord1.bitFromValueOr(20, false);
  bool sec1EngagedInRoll = busInputs.sec1.discreteStatusWord1.bitFromValueOr(22, false);
  bool sec2EngagedInRoll = busInputs.sec2.discreteStatusWord1.bitFromValueOr(22, false);
  bool sec3EngagedInRoll = busInputs.sec3.discreteStatusWord1.bitFromValueOr(22, false);

  bool elac1EngagedInPitch = busInputs.elac1.discreteStatusWord1.bitFromValueOr(19, false);
  bool elac2EngagedInPitch = busInputs.elac2.discreteStatusWord1.bitFromValueOr(19, false);
  bool sec1EngagedInPitch = busInputs.sec1.discreteStatusWord1.bitFromValueOr(23, false);
  bool sec2EngagedInPitch = busInputs.sec2.discreteStatusWord1.bitFromValueOr(23, false);

  if (elac1EngagedInRoll) {
    systemLateralLaw = getLateralLawStatusFromBits(busInputs.elac1.discreteStatusWord1.bitFromValue(26),
                                                   busInputs.elac1.discreteStatusWord1.bitFromValue(27),
                                                   busInputs.elac1.discreteStatusWord1.bitFromValue(28));
  } else if (elac2EngagedInRoll) {
    systemLateralLaw = getLateralLawStatusFromBits(busInputs.elac2.discreteStatusWord1.bitFromValue(26),
                                                   busInputs.elac2.discreteStatusWord1.bitFromValue(27),
                                                   busInputs.elac2.discreteStatusWord1.bitFromValue(28));
  } else if (sec1EngagedInRoll || sec2EngagedInRoll || sec3EngagedInRoll) {
    systemLateralLaw = LateralLaw::DirectLaw;
  } else {
    systemLateralLaw = LateralLaw::None;
  }

  if (elac1EngagedInPitch) {
    systemPitchLaw = getPitchLawStatusFromBits(busInputs.elac1.discreteStatusWord1.bitFromValue(23),
                                               busInputs.elac1.discreteStatusWord1.bitFromValue(24),
                                               busInputs.elac1.discreteStatusWord1.bitFromValue(25));
  } else if (elac2EngagedInPitch) {
    systemPitchLaw = getPitchLawStatusFromBits(busInputs.elac2.discreteStatusWord1.bitFromValue(23),
                                               busInputs.elac2.discreteStatusWord1.bitFromValue(24),
                                               busInputs.elac2.discreteStatusWord1.bitFromValue(25));
  } else if (sec1EngagedInPitch) {
    systemPitchLaw =
        getPitchLawStatusFromBits(busInputs.sec1.discreteStatusWord1.bitFromValue(19), busInputs.sec1.discreteStatusWord1.bitFromValue(20),
                                  busInputs.sec1.discreteStatusWord1.bitFromValue(21));
  } else if (sec2EngagedInPitch) {
    systemPitchLaw =
        getPitchLawStatusFromBits(busInputs.sec2.discreteStatusWord1.bitFromValue(19), busInputs.sec2.discreteStatusWord1.bitFromValue(20),
                                  busInputs.sec2.discreteStatusWord1.bitFromValue(21));
  } else {
    systemLateralLaw = LateralLaw::None;
  }
}

// Write the bus output data and return it.
FcdcBus Fcdc::getBusOutputs() {
  FcdcBus output = {};

  if (!monitoringHealthy) {
    output.efcsStatus1.setSsm(Arinc429SignStatus::FailureWarning);
    output.efcsStatus2.setSsm(Arinc429SignStatus::FailureWarning);
    output.efcsStatus3.setSsm(Arinc429SignStatus::FailureWarning);
    output.efcsStatus4.setSsm(Arinc429SignStatus::FailureWarning);
    output.efcsStatus5.setSsm(Arinc429SignStatus::FailureWarning);
    output.captRollCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.foRollCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.rudderPedalPosition.setSsm(Arinc429SignStatus::FailureWarning);
    output.captPitchCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.foPitchCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.aileronLeftPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.elevatorLeftPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.aileronRightPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.elevatorRightPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.horizStabTrimPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerLeft1Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerLeft2Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerLeft3Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerLeft4Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerLeft5Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerRight1Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerRight2Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerRight3Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerRight4Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerRight5Pos.setSsm(Arinc429SignStatus::FailureWarning);

    return output;
  }

  output.efcsStatus1.setSsm(Arinc429SignStatus::NormalOperation);
  output.efcsStatus1.setBit(11, systemPitchLaw == PitchLaw::NormalLaw);
  output.efcsStatus1.setBit(12, systemPitchLaw == PitchLaw::AlternateLaw1);
  output.efcsStatus1.setBit(13, systemPitchLaw == PitchLaw::AlternateLaw2);
  output.efcsStatus1.setBit(15, systemPitchLaw == PitchLaw::DirectLaw);
  output.efcsStatus1.setBit(16, systemLateralLaw == LateralLaw::NormalLaw);
  output.efcsStatus1.setBit(17, systemLateralLaw == LateralLaw::DirectLaw);
  output.efcsStatus1.setBit(18, false);  // No idea what this bit is supposed to mean
  output.efcsStatus1.setBit(19, busInputs.elac1.discreteStatusWord1.bitFromValueOr(21, true));
  output.efcsStatus1.setBit(20, busInputs.elac1.discreteStatusWord1.bitFromValueOr(22, true));
  output.efcsStatus1.setBit(21, busInputs.elac2.discreteStatusWord1.bitFromValueOr(21, true));
  output.efcsStatus1.setBit(22, busInputs.elac2.discreteStatusWord1.bitFromValueOr(22, true));
  output.efcsStatus1.setBit(23, !discreteInputs.elac1Valid);
  output.efcsStatus1.setBit(24, !discreteInputs.elac2Valid);
  output.efcsStatus1.setBit(25, !discreteInputs.sec1Valid);
  output.efcsStatus1.setBit(26, !discreteInputs.sec2Valid);
  output.efcsStatus1.setBit(27, false);
  output.efcsStatus1.setBit(28, discreteInputs.oppFcdcFailed);
  output.efcsStatus1.setBit(29, !discreteInputs.sec3Valid);

  output.efcsStatus2.setSsm(Arinc429SignStatus::NormalOperation);
  output.efcsStatus2.setBit(11, busInputs.elac1.discreteStatusWord1.bitFromValueOr(11, false));
  output.efcsStatus2.setBit(12, busInputs.elac2.discreteStatusWord1.bitFromValueOr(11, false));
  output.efcsStatus2.setBit(13, busInputs.elac1.discreteStatusWord1.bitFromValueOr(12, false));
  output.efcsStatus2.setBit(14, busInputs.elac2.discreteStatusWord1.bitFromValueOr(12, false));
  output.efcsStatus2.setBit(15, busInputs.elac1.discreteStatusWord1.bitFromValueOr(13, false));
  output.efcsStatus2.setBit(16, busInputs.elac2.discreteStatusWord1.bitFromValueOr(13, false));
  output.efcsStatus2.setBit(17, busInputs.elac1.discreteStatusWord1.bitFromValueOr(14, false));
  output.efcsStatus2.setBit(18, busInputs.elac2.discreteStatusWord1.bitFromValueOr(14, false));
  output.efcsStatus2.setBit(19, false);
  output.efcsStatus2.setBit(20, false);
  output.efcsStatus2.setBit(21, false);
  output.efcsStatus2.setBit(22, false);
  output.efcsStatus2.setBit(23, false);
  output.efcsStatus2.setBit(24, false);
  output.efcsStatus2.setBit(25, false);
  output.efcsStatus2.setBit(26, false);
  output.efcsStatus2.setBit(27, false);
  output.efcsStatus2.setBit(28, false);
  output.efcsStatus2.setBit(29, false);

  output.efcsStatus3.setSsm(Arinc429SignStatus::NormalOperation);
  output.efcsStatus3.setBit(11, busInputs.elac1.discreteStatusWord1.bitFromValueOr(15, false));
  output.efcsStatus3.setBit(12, busInputs.elac2.discreteStatusWord1.bitFromValueOr(15, false));
  output.efcsStatus3.setBit(13, busInputs.elac1.discreteStatusWord1.bitFromValueOr(16, false));
  output.efcsStatus3.setBit(14, busInputs.elac2.discreteStatusWord1.bitFromValueOr(16, false));
  output.efcsStatus3.setBit(15, busInputs.elac1.discreteStatusWord1.bitFromValueOr(17, false));
  output.efcsStatus3.setBit(16, busInputs.elac2.discreteStatusWord1.bitFromValueOr(17, false));
  output.efcsStatus3.setBit(17, busInputs.elac1.discreteStatusWord1.bitFromValueOr(18, false));
  output.efcsStatus3.setBit(18, busInputs.elac2.discreteStatusWord1.bitFromValueOr(18, false));
  output.efcsStatus3.setBit(19, discreteInputs.elac1Off);
  output.efcsStatus3.setBit(20, discreteInputs.elac2Off);
  output.efcsStatus3.setBit(21, busInputs.sec3.discreteStatusWord1.bitFromValueOr(15, false));
  output.efcsStatus3.setBit(22, busInputs.sec3.discreteStatusWord1.bitFromValueOr(16, false));
  output.efcsStatus3.setBit(23, busInputs.sec1.discreteStatusWord1.bitFromValueOr(15, false));
  output.efcsStatus3.setBit(24, busInputs.sec1.discreteStatusWord1.bitFromValueOr(16, false));
  output.efcsStatus3.setBit(25, busInputs.sec2.discreteStatusWord1.bitFromValueOr(15, false));
  output.efcsStatus3.setBit(26, false);
  output.efcsStatus3.setBit(27, discreteInputs.sec1Off);
  output.efcsStatus3.setBit(28, discreteInputs.sec2Off);
  output.efcsStatus3.setBit(29, discreteInputs.sec3Off);

  output.efcsStatus4.setSsm(Arinc429SignStatus::NormalOperation);
  output.efcsStatus4.setBit(11, busInputs.sec3.leftSpoiler1Position.valueOr(0) > 2.5);
  output.efcsStatus4.setBit(12, busInputs.sec3.rightSpoiler1Position.valueOr(0) > 2.5);
  output.efcsStatus4.setBit(13, busInputs.sec3.leftSpoiler2Position.valueOr(0) > 2.5);
  output.efcsStatus4.setBit(14, busInputs.sec3.rightSpoiler2Position.valueOr(0) > 2.5);
  output.efcsStatus4.setBit(15, busInputs.sec1.leftSpoiler1Position.valueOr(0) > 2.5);
  output.efcsStatus4.setBit(16, busInputs.sec1.rightSpoiler1Position.valueOr(0) > 2.5);
  output.efcsStatus4.setBit(17, busInputs.sec1.leftSpoiler2Position.valueOr(0) > 2.5);
  output.efcsStatus4.setBit(18, busInputs.sec1.rightSpoiler2Position.valueOr(0) > 2.5);
  output.efcsStatus4.setBit(19, busInputs.sec2.leftSpoiler1Position.valueOr(0) > 2.5);
  output.efcsStatus4.setBit(20, busInputs.sec2.rightSpoiler1Position.valueOr(0) > 2.5);
  output.efcsStatus4.setBit(21, busInputs.sec3.leftSpoiler1Position.isNo() && busInputs.sec3.rightSpoiler1Position.isNo());
  output.efcsStatus4.setBit(22, busInputs.sec3.leftSpoiler2Position.isNo() && busInputs.sec3.rightSpoiler2Position.isNo());
  output.efcsStatus4.setBit(23, busInputs.sec1.leftSpoiler1Position.isNo() && busInputs.sec1.rightSpoiler1Position.isNo());
  output.efcsStatus4.setBit(24, busInputs.sec1.leftSpoiler2Position.isNo() && busInputs.sec1.rightSpoiler2Position.isNo());
  output.efcsStatus4.setBit(25, busInputs.sec2.leftSpoiler1Position.isNo() && busInputs.sec2.rightSpoiler1Position.isNo());
  output.efcsStatus4.setBit(26, false);
  output.efcsStatus4.setBit(27, false);
  output.efcsStatus4.setBit(28, false);
  output.efcsStatus4.setBit(29, false);

  output.efcsStatus5.setSsm(Arinc429SignStatus::NormalOperation);
  output.efcsStatus5.setBit(11, false);
  output.efcsStatus5.setBit(12, false);
  output.efcsStatus5.setBit(13, false);
  output.efcsStatus5.setBit(14, false);
  output.efcsStatus5.setBit(15, false);
  output.efcsStatus5.setBit(16, false);
  output.efcsStatus5.setBit(17, false);
  output.efcsStatus5.setBit(18, false);
  output.efcsStatus5.setBit(19, false);
  output.efcsStatus5.setBit(20, false);
  output.efcsStatus5.setBit(21, false);
  output.efcsStatus5.setBit(22, false);
  output.efcsStatus5.setBit(23, false);
  output.efcsStatus5.setBit(24, false);
  output.efcsStatus5.setBit(25, false);
  output.efcsStatus5.setBit(26, false);
  output.efcsStatus5.setBit(27, false);
  output.efcsStatus5.setBit(28, false);
  output.efcsStatus5.setBit(29, false);

  bool elac1EngagedInRoll = busInputs.elac1.discreteStatusWord1.bitFromValueOr(20, false);
  bool elac2EngagedInRoll = busInputs.elac2.discreteStatusWord1.bitFromValueOr(20, false);
  bool sec1EngagedInRoll = busInputs.sec1.discreteStatusWord1.bitFromValueOr(22, false);
  bool sec2EngagedInRoll = busInputs.sec2.discreteStatusWord1.bitFromValueOr(22, false);
  bool sec3EngagedInRoll = busInputs.sec3.discreteStatusWord1.bitFromValueOr(22, false);

  bool elac1EngagedInPitch = busInputs.elac1.discreteStatusWord1.bitFromValueOr(19, false);
  bool elac2EngagedInPitch = busInputs.elac2.discreteStatusWord1.bitFromValueOr(19, false);
  bool sec1EngagedInPitch = busInputs.sec1.discreteStatusWord1.bitFromValueOr(23, false);
  bool sec2EngagedInPitch = busInputs.sec2.discreteStatusWord1.bitFromValueOr(23, false);

  if (elac1EngagedInRoll) {
    output.rudderPedalPosition.setFromData(busInputs.elac1.rudderPedalPosition.valueOr(0), Arinc429SignStatus::NormalOperation);
    output.aileronLeftPos.setFromData(busInputs.elac2.leftAileronPosition.valueOr(0), Arinc429SignStatus::NormalOperation);
    output.aileronRightPos.setFromData(busInputs.elac2.rightAileronPosition.valueOr(0), Arinc429SignStatus::NormalOperation);
  } else if (elac2EngagedInRoll) {
    output.rudderPedalPosition.setFromData(busInputs.elac2.rudderPedalPosition.valueOr(0), Arinc429SignStatus::NormalOperation);
    output.aileronLeftPos.setFromData(busInputs.elac1.leftAileronPosition.valueOr(0), Arinc429SignStatus::NormalOperation);
    output.aileronRightPos.setFromData(busInputs.elac1.rightAileronPosition.valueOr(0), Arinc429SignStatus::NormalOperation);
  } else {
    output.rudderPedalPosition.setFromData(0, Arinc429SignStatus::NoComputedData);
    output.aileronLeftPos.setFromData(0, Arinc429SignStatus::NoComputedData);
    output.aileronRightPos.setFromData(0, Arinc429SignStatus::NoComputedData);
  }

  if (elac2EngagedInPitch) {
    output.captPitchCommand.setFromData(busInputs.elac2.leftSidestickPitchCommand.valueOr(0), Arinc429SignStatus::NormalOperation);
    output.foPitchCommand.setFromData(busInputs.elac2.rightSidestickPitchCommand.valueOr(0), Arinc429SignStatus::NormalOperation);
    output.elevatorLeftPos.setFromData(busInputs.elac2.leftElevatorPosition.valueOr(0), Arinc429SignStatus::NormalOperation);
    output.elevatorRightPos.setFromData(busInputs.elac2.rightElevatorPosition.valueOr(0), Arinc429SignStatus::NormalOperation);
    output.horizStabTrimPos.setFromData(busInputs.elac2.thsPosition.valueOr(0), Arinc429SignStatus::NormalOperation);
  } else if (elac1EngagedInPitch) {
    output.captPitchCommand.setFromData(busInputs.elac1.leftSidestickPitchCommand.valueOr(0), Arinc429SignStatus::NormalOperation);
    output.foPitchCommand.setFromData(busInputs.elac1.rightSidestickPitchCommand.valueOr(0), Arinc429SignStatus::NormalOperation);
    output.elevatorLeftPos.setFromData(busInputs.elac1.leftElevatorPosition.valueOr(0), Arinc429SignStatus::NormalOperation);
    output.elevatorRightPos.setFromData(busInputs.elac1.rightElevatorPosition.valueOr(0), Arinc429SignStatus::NormalOperation);
    output.horizStabTrimPos.setFromData(busInputs.elac1.thsPosition.valueOr(0), Arinc429SignStatus::NormalOperation);
  } else if (sec2EngagedInPitch) {
    output.captPitchCommand.setFromData(0, Arinc429SignStatus::NormalOperation);
    output.foPitchCommand.setFromData(0, Arinc429SignStatus::NormalOperation);
    output.elevatorLeftPos.setFromData(0, Arinc429SignStatus::NormalOperation);
    output.elevatorRightPos.setFromData(0, Arinc429SignStatus::NormalOperation);
    output.horizStabTrimPos.setFromData(0, Arinc429SignStatus::NormalOperation);
  } else if (sec1EngagedInPitch) {
    output.captPitchCommand.setFromData(0, Arinc429SignStatus::NormalOperation);
    output.foPitchCommand.setFromData(0, Arinc429SignStatus::NormalOperation);
    output.elevatorLeftPos.setFromData(0, Arinc429SignStatus::NormalOperation);
    output.elevatorRightPos.setFromData(0, Arinc429SignStatus::NormalOperation);
    output.horizStabTrimPos.setFromData(0, Arinc429SignStatus::NormalOperation);
  } else {
    output.captPitchCommand.setFromData(0, Arinc429SignStatus::NoComputedData);
    output.foPitchCommand.setFromData(0, Arinc429SignStatus::NoComputedData);
    output.elevatorLeftPos.setFromData(0, Arinc429SignStatus::NoComputedData);
    output.elevatorRightPos.setFromData(0, Arinc429SignStatus::NoComputedData);
    output.horizStabTrimPos.setFromData(0, Arinc429SignStatus::NoComputedData);
  }

  output.spoilerLeft1Pos.setFromData(0, Arinc429SignStatus::NoComputedData);
  output.spoilerLeft2Pos.setFromData(0, Arinc429SignStatus::NoComputedData);
  output.spoilerLeft3Pos.setFromData(0, Arinc429SignStatus::NoComputedData);
  output.spoilerLeft4Pos.setFromData(0, Arinc429SignStatus::NoComputedData);
  output.spoilerLeft5Pos.setFromData(0, Arinc429SignStatus::NoComputedData);
  output.spoilerRight1Pos.setFromData(0, Arinc429SignStatus::NoComputedData);
  output.spoilerRight2Pos.setFromData(0, Arinc429SignStatus::NoComputedData);
  output.spoilerRight3Pos.setFromData(0, Arinc429SignStatus::NoComputedData);
  output.spoilerRight4Pos.setFromData(0, Arinc429SignStatus::NoComputedData);
  output.spoilerRight5Pos.setFromData(0, Arinc429SignStatus::NoComputedData);

  return output;
}

// Write the discrete output data and return it.
FcdcDiscreteOutputs Fcdc::getDiscreteOutputs() {
  FcdcDiscreteOutputs output = {};

  if (!monitoringHealthy) {
    output.captRedPriorityLightOn = false;
    output.captGreenPriorityLightOn = false;
    output.fcdcValid = false;
    output.foRedPriorityLightOn = false;
    output.foGreenPriorityLightOn = false;
  } else {
    output.captRedPriorityLightOn = false;
    output.captGreenPriorityLightOn = false;
    output.fcdcValid = true;
    output.foRedPriorityLightOn = false;
    output.foGreenPriorityLightOn = false;
  }

  return output;
}
