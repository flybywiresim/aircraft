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
    consolidatePositionData();
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

void Fcdc::consolidatePositionData() {
  bool elac1EngagedInRoll = busInputs.elac1.discreteStatusWord1.bitFromValueOr(20, false);
  bool elac2EngagedInRoll = busInputs.elac2.discreteStatusWord1.bitFromValueOr(20, false);
  bool sec1EngagedInRoll = busInputs.sec1.discreteStatusWord1.bitFromValueOr(22, false);
  bool sec2EngagedInRoll = busInputs.sec2.discreteStatusWord1.bitFromValueOr(22, false);
  bool sec3EngagedInRoll = busInputs.sec3.discreteStatusWord1.bitFromValueOr(22, false);

  bool elac1EngagedInPitch = busInputs.elac1.discreteStatusWord1.bitFromValueOr(19, false);
  bool elac2EngagedInPitch = busInputs.elac2.discreteStatusWord1.bitFromValueOr(19, false);
  bool sec1EngagedInPitch = busInputs.sec1.discreteStatusWord1.bitFromValueOr(23, false);
  bool sec2EngagedInPitch = busInputs.sec2.discreteStatusWord1.bitFromValueOr(23, false);

  // Compute Aileron Data. Look at each side individually: if the data from the ELAC that is
  // engaged in roll is valid, use that data. If not, take the data from the other ELAC.
  // If neither are valid, set the respective aileron position as invalid.
  leftAileronPosValid = true;
  if (elac1EngagedInRoll && busInputs.elac1.leftAileronPosition.isNo()) {
    leftAileronPos = busInputs.elac1.leftAileronPosition.value();
  } else if (elac2EngagedInRoll && busInputs.elac2.leftAileronPosition.isNo()) {
    leftAileronPos = busInputs.elac2.leftAileronPosition.value();
  } else if (busInputs.elac1.leftAileronPosition.isNo()) {
    leftAileronPos = busInputs.elac1.leftAileronPosition.value();
  } else if (busInputs.elac2.leftAileronPosition.isNo()) {
    leftAileronPos = busInputs.elac2.leftAileronPosition.value();
  } else {
    leftAileronPos = 0;
    leftAileronPosValid = false;
  }

  rightAileronPosValid = true;
  if (elac1EngagedInRoll && busInputs.elac1.rightAileronPosition.isNo()) {
    rightAileronPos = busInputs.elac1.rightAileronPosition.value();
  } else if (elac2EngagedInRoll && busInputs.elac2.rightAileronPosition.isNo()) {
    rightAileronPos = busInputs.elac2.rightAileronPosition.value();
  } else if (busInputs.elac1.rightAileronPosition.isNo()) {
    rightAileronPos = busInputs.elac1.rightAileronPosition.value();
  } else if (busInputs.elac2.rightAileronPosition.isNo()) {
    rightAileronPos = busInputs.elac2.rightAileronPosition.value();
  } else {
    rightAileronPos = 0;
    rightAileronPosValid = false;
  }

  // Compute the sidestick positions in roll. Always take the sidestick data
  // from the ELAC that is engaged in roll axis. If no ELAC is engaged in roll,
  // then all the SECs are engaged seperately in the roll axis. In that case, simply
  // choose the first one that has valid stick positions.
  // If none are valid, set as invalid.
  if (elac1EngagedInRoll) {
    rollSidestickPosCapt = busInputs.elac1.leftSidestickRollCommand.value();
    rollSidestickPosCaptValid = busInputs.elac1.leftSidestickRollCommand.isNo();
    rollSidestickPosFo = busInputs.elac1.rightSidestickRollCommand.value();
    rollSidestickPosFoValid = busInputs.elac1.rightSidestickRollCommand.isNo();
  } else if (elac2EngagedInRoll) {
    rollSidestickPosCapt = busInputs.elac2.leftSidestickRollCommand.value();
    rollSidestickPosCaptValid = busInputs.elac2.leftSidestickRollCommand.isNo();
    rollSidestickPosFo = busInputs.elac2.rightSidestickRollCommand.value();
    rollSidestickPosFoValid = busInputs.elac2.rightSidestickRollCommand.isNo();
  } else if (sec1EngagedInRoll && (busInputs.sec1.leftSidestickRollCommand.isNo() || busInputs.sec1.rightSidestickRollCommand.isNo())) {
    rollSidestickPosCapt = busInputs.sec1.leftSidestickRollCommand.value();
    rollSidestickPosCaptValid = busInputs.sec1.leftSidestickRollCommand.isNo();
    rollSidestickPosFo = busInputs.sec1.rightSidestickRollCommand.value();
    rollSidestickPosFoValid = busInputs.sec1.rightSidestickRollCommand.isNo();
  } else if (sec2EngagedInRoll && (busInputs.sec2.leftSidestickRollCommand.isNo() || busInputs.sec2.rightSidestickRollCommand.isNo())) {
    rollSidestickPosCapt = busInputs.sec2.leftSidestickRollCommand.value();
    rollSidestickPosCaptValid = busInputs.sec2.leftSidestickRollCommand.isNo();
    rollSidestickPosFo = busInputs.sec2.rightSidestickRollCommand.value();
    rollSidestickPosFoValid = busInputs.sec2.rightSidestickRollCommand.isNo();
  } else if (sec3EngagedInRoll && (busInputs.sec3.leftSidestickRollCommand.isNo() || busInputs.sec3.rightSidestickRollCommand.isNo())) {
    rollSidestickPosCapt = busInputs.sec3.leftSidestickRollCommand.value();
    rollSidestickPosCaptValid = busInputs.sec3.leftSidestickRollCommand.isNo();
    rollSidestickPosFo = busInputs.sec3.rightSidestickRollCommand.value();
    rollSidestickPosFoValid = busInputs.sec3.rightSidestickRollCommand.isNo();
  } else {
    rollSidestickPosCapt = 0;
    rollSidestickPosCaptValid = false;
    rollSidestickPosFo = 0;
    rollSidestickPosFoValid = false;
  }

  // Compute Elevator/THS data. Look at each surface individually: if the data from the computer that is
  // engaged in roll is valid, use that data. If not, take the data from the other computers.
  // If neither are valid, set the respective position as invalid.
  leftElevatorPosValid = true;
  if (elac2EngagedInPitch && busInputs.elac2.leftElevatorPosition.isNo()) {
    leftElevatorPos = busInputs.elac2.leftElevatorPosition.value();
  } else if (elac1EngagedInPitch && busInputs.elac1.leftElevatorPosition.isNo()) {
    leftElevatorPos = busInputs.elac1.leftElevatorPosition.value();
  } else if (sec2EngagedInPitch && busInputs.sec2.leftElevatorPosition.isNo()) {
    leftElevatorPos = busInputs.sec2.leftElevatorPosition.value();
  } else if (sec1EngagedInPitch && busInputs.sec1.leftElevatorPosition.isNo()) {
    leftElevatorPos = busInputs.sec1.leftElevatorPosition.value();
  } else if (busInputs.elac2.leftElevatorPosition.isNo()) {
    leftElevatorPos = busInputs.elac2.leftElevatorPosition.value();
  } else if (busInputs.elac1.leftElevatorPosition.isNo()) {
    leftElevatorPos = busInputs.elac1.leftElevatorPosition.value();
  } else if (busInputs.sec2.leftElevatorPosition.isNo()) {
    leftElevatorPos = busInputs.sec2.leftElevatorPosition.value();
  } else if (busInputs.sec1.leftElevatorPosition.isNo()) {
    leftElevatorPos = busInputs.sec1.leftElevatorPosition.value();
  } else {
    leftElevatorPos = 0;
    leftElevatorPosValid = false;
  }

  rightElevatorPosValid = true;
  if (elac2EngagedInPitch && busInputs.elac2.rightElevatorPosition.isNo()) {
    rightElevatorPos = busInputs.elac2.rightElevatorPosition.value();
  } else if (elac1EngagedInPitch && busInputs.elac1.rightElevatorPosition.isNo()) {
    rightElevatorPos = busInputs.elac1.rightElevatorPosition.value();
  } else if (sec2EngagedInPitch && busInputs.sec2.rightElevatorPosition.isNo()) {
    rightElevatorPos = busInputs.sec2.rightElevatorPosition.value();
  } else if (sec1EngagedInPitch && busInputs.sec1.rightElevatorPosition.isNo()) {
    rightElevatorPos = busInputs.sec1.rightElevatorPosition.value();
  } else if (busInputs.elac2.rightElevatorPosition.isNo()) {
    rightElevatorPos = busInputs.elac2.rightElevatorPosition.value();
  } else if (busInputs.elac1.rightElevatorPosition.isNo()) {
    rightElevatorPos = busInputs.elac1.rightElevatorPosition.value();
  } else if (busInputs.sec2.rightElevatorPosition.isNo()) {
    rightElevatorPos = busInputs.sec2.rightElevatorPosition.value();
  } else if (busInputs.sec1.rightElevatorPosition.isNo()) {
    rightElevatorPos = busInputs.sec1.rightElevatorPosition.value();
  } else {
    rightElevatorPos = 0;
    rightElevatorPosValid = false;
  }

  thsPosValid = true;
  if (elac2EngagedInPitch && busInputs.elac2.thsPosition.isNo()) {
    thsPos = busInputs.elac2.thsPosition.value();
  } else if (elac1EngagedInPitch && busInputs.elac1.thsPosition.isNo()) {
    thsPos = busInputs.elac1.thsPosition.value();
  } else if (sec2EngagedInPitch && busInputs.sec2.thsPosition.isNo()) {
    thsPos = busInputs.sec2.thsPosition.value();
  } else if (sec1EngagedInPitch && busInputs.sec1.thsPosition.isNo()) {
    thsPos = busInputs.sec1.thsPosition.value();
  } else if (busInputs.elac2.thsPosition.isNo()) {
    thsPos = busInputs.elac2.thsPosition.value();
  } else if (busInputs.elac1.thsPosition.isNo()) {
    thsPos = busInputs.elac1.thsPosition.value();
  } else if (busInputs.sec2.thsPosition.isNo()) {
    thsPos = busInputs.sec2.thsPosition.value();
  } else if (busInputs.sec1.thsPosition.isNo()) {
    thsPos = busInputs.sec1.thsPosition.value();
  } else {
    thsPos = 0;
    thsPosValid = false;
  }
}

// Consolidate all the active law data from the different computers, and then compute
// the overall active system law from the law status of the computers that are engaged in the
// respective axes.
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
    systemPitchLaw = PitchLaw::None;
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

  bool leftElev1Fault = (!discreteInputs.elac1Valid && !discreteInputs.sec1Valid) ||
                        busInputs.elac1.discreteStatusWord1.bitFromValueOr(13, false) ||
                        busInputs.sec1.discreteStatusWord1.bitFromValueOr(13, false);
  bool leftElev2Fault = (!discreteInputs.elac2Valid && !discreteInputs.sec2Valid) ||
                        busInputs.elac2.discreteStatusWord1.bitFromValueOr(13, false) ||
                        busInputs.sec2.discreteStatusWord1.bitFromValueOr(13, false);
  bool rightElev1Fault = (!discreteInputs.elac1Valid && !discreteInputs.sec1Valid) ||
                         busInputs.elac1.discreteStatusWord1.bitFromValueOr(14, false) ||
                         busInputs.sec1.discreteStatusWord1.bitFromValueOr(14, false);
  bool rightElev2Fault = (!discreteInputs.elac2Valid && !discreteInputs.sec2Valid) ||
                         busInputs.elac2.discreteStatusWord1.bitFromValueOr(14, false) ||
                         busInputs.sec2.discreteStatusWord1.bitFromValueOr(14, false);

  output.efcsStatus2.setSsm(Arinc429SignStatus::NormalOperation);
  output.efcsStatus2.setBit(11, busInputs.elac1.discreteStatusWord1.bitFromValueOr(11, true));
  output.efcsStatus2.setBit(12, busInputs.elac2.discreteStatusWord1.bitFromValueOr(11, true));
  output.efcsStatus2.setBit(13, busInputs.elac1.discreteStatusWord1.bitFromValueOr(12, true));
  output.efcsStatus2.setBit(14, busInputs.elac2.discreteStatusWord1.bitFromValueOr(12, true));
  output.efcsStatus2.setBit(15, leftElev1Fault);
  output.efcsStatus2.setBit(16, leftElev2Fault);
  output.efcsStatus2.setBit(17, rightElev1Fault);
  output.efcsStatus2.setBit(18, rightElev2Fault);
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
  output.efcsStatus3.setBit(
      15, busInputs.elac1.discreteStatusWord1.bitFromValueOr(17, false) || busInputs.sec1.discreteStatusWord1.bitFromValueOr(17, false));
  output.efcsStatus3.setBit(
      16, busInputs.elac2.discreteStatusWord1.bitFromValueOr(17, false) || busInputs.sec2.discreteStatusWord1.bitFromValueOr(17, false));
  output.efcsStatus3.setBit(
      17, busInputs.elac1.discreteStatusWord1.bitFromValueOr(18, false) || busInputs.sec1.discreteStatusWord1.bitFromValueOr(18, false));
  output.efcsStatus3.setBit(
      18, busInputs.elac2.discreteStatusWord1.bitFromValueOr(18, false) || busInputs.sec2.discreteStatusWord1.bitFromValueOr(18, false));
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
  output.efcsStatus5.setBit(11, !busInputs.sec1.speedBrakeLeverCommand.isNo() && discreteInputs.sec1Valid);
  output.efcsStatus5.setBit(12, !busInputs.sec2.speedBrakeLeverCommand.isNo() && discreteInputs.sec2Valid);
  output.efcsStatus5.setBit(13, !busInputs.sec3.speedBrakeLeverCommand.isNo() && discreteInputs.sec3Valid);
  output.efcsStatus5.setBit(14, false);
  output.efcsStatus5.setBit(15, false);
  output.efcsStatus5.setBit(16, false);
  output.efcsStatus5.setBit(17, false);
  output.efcsStatus5.setBit(18, false);
  output.efcsStatus5.setBit(19, false);
  output.efcsStatus5.setBit(20, false);
  output.efcsStatus5.setBit(21, busInputs.sec3.discreteStatusWord1.bitFromValueOr(11, false));
  output.efcsStatus5.setBit(22, busInputs.sec3.discreteStatusWord1.bitFromValueOr(12, false));
  output.efcsStatus5.setBit(23, busInputs.sec1.discreteStatusWord1.bitFromValueOr(11, false));
  output.efcsStatus5.setBit(24, busInputs.sec1.discreteStatusWord1.bitFromValueOr(12, false));
  output.efcsStatus5.setBit(25, busInputs.sec2.discreteStatusWord1.bitFromValueOr(11, false));
  output.efcsStatus5.setBit(26, false);
  output.efcsStatus5.setBit(27, false);
  output.efcsStatus5.setBit(28, false);
  output.efcsStatus5.setBit(29, false);

  // Roll Data
  if (leftAileronPosValid) {
    output.aileronLeftPos.setFromData(leftAileronPos, Arinc429SignStatus::NormalOperation);
  } else {
    output.aileronLeftPos.setFromData(0, Arinc429SignStatus::NoComputedData);
  }

  if (rightAileronPosValid) {
    output.aileronRightPos.setFromData(rightAileronPos, Arinc429SignStatus::NormalOperation);
  } else {
    output.aileronRightPos.setFromData(0, Arinc429SignStatus::NoComputedData);
  }

  if (rollSidestickPosCaptValid) {
    output.captRollCommand.setFromData(rollSidestickPosCapt, Arinc429SignStatus::NormalOperation);
  } else {
    output.captRollCommand.setFromData(0, Arinc429SignStatus::NoComputedData);
  }

  if (rollSidestickPosFoValid) {
    output.foRollCommand.setFromData(rollSidestickPosFo, Arinc429SignStatus::NormalOperation);
  } else {
    output.foRollCommand.setFromData(0, Arinc429SignStatus::NoComputedData);
  }

  if (rudderPedalPosValid) {
    output.rudderPedalPosition.setFromData(rudderPedalPos, Arinc429SignStatus::NormalOperation);
  } else {
    output.rudderPedalPosition.setFromData(0, Arinc429SignStatus::NoComputedData);
  }

  // Pitch Data
  if (leftElevatorPosValid) {
    output.elevatorLeftPos.setFromData(leftElevatorPos, Arinc429SignStatus::NormalOperation);
  } else {
    output.elevatorLeftPos.setFromData(0, Arinc429SignStatus::NoComputedData);
  }

  if (rightElevatorPosValid) {
    output.elevatorRightPos.setFromData(rightElevatorPos, Arinc429SignStatus::NormalOperation);
  } else {
    output.elevatorRightPos.setFromData(0, Arinc429SignStatus::NoComputedData);
  }

  if (thsPosValid) {
    output.horizStabTrimPos.setFromData(thsPos, Arinc429SignStatus::NormalOperation);
  } else {
    output.horizStabTrimPos.setFromData(0, Arinc429SignStatus::NoComputedData);
  }

  if (pitchSidestickPosCaptValid) {
    output.captPitchCommand.setFromData(pitchSidestickPosCapt, Arinc429SignStatus::NormalOperation);
  } else {
    output.captPitchCommand.setFromData(0, Arinc429SignStatus::NoComputedData);
  }

  if (pitchSidestickPosFoValid) {
    output.foPitchCommand.setFromData(pitchSidestickPosFo, Arinc429SignStatus::NormalOperation);
  } else {
    output.foPitchCommand.setFromData(0, Arinc429SignStatus::NoComputedData);
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
