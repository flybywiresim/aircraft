#include "Elac.h"
#include <iostream>

Elac::Elac(bool isUnit1) : isUnit1(isUnit1) {}

// If the power supply is valid, perform the self-test-sequence.
// If at least one hydraulic source is pressurised, perform a short test.
// If no hydraulic supply is pressurised, and the outage was more than 3 seconds (or the switch was turned off),
// perform a long selft-test.
// Else, perform a short self-test.
void Elac::initSelfTests(bool viaPushButton) {
  if (powerSupplyFault)
    return;

  if (discreteInputs.greenLowPressure && discreteInputs.blueLowPressure && discreteInputs.yellowLowPressure &&
      (powerSupplyOutageTime > 3 || viaPushButton)) {
    selfTestTimer = longSelfTestDuration;
  } else {
    selfTestTimer = shortSelfTestDuration;
  }
}

// After the self-test is complete, erase all data in RAM.
void Elac::clearMemory() {
  isYellowHydraulicPowerAvail = false;
  isBlueHydraulicPowerAvail = false;
  isGreenHydraulicPowerAvail = false;

  isEngagedInPitch = false;
  canEngageInPitch = false;
  hasPriorityInPitch = false;
  leftElevatorAvail = false;
  rightElevatorAvail = false;
  isEngagedInRoll = false;
  canEngageInRoll = false;
  hasPriorityInRoll = false;
  leftAileronAvail = false;
  rightAileronAvail = false;
  lateralLawCapability = LateralLaw::None;
  activeLateralLaw = LateralLaw::None;
  pitchLawCapability = PitchLaw::None;
  activePitchLaw = PitchLaw::None;
}

// Main update cycle
void Elac::update(double deltaTime, double simulationTime, bool faultActive, bool isPowered) {
  monitorPowerSupply(deltaTime, isPowered);
  monitorButtonStatus();

  updateSelfTest(deltaTime);
  monitorSelf(faultActive);

  if (monitoringHealthy) {
    monitorHydraulicData();
    computeComputerEngagementPitch();
    computeComputerEngagementRoll();
    computeLateralLawCapability();
    computePitchLawCapability();
    computeActiveLawsAndFunctionStatus();
  }
}

// Compute this computer's pitch law capability, i.e.
// the "highest" pitch law that can be engaged on the pitch axis by this computer
void Elac::computePitchLawCapability() {
  // Placeholder
  pitchLawCapability = PitchLaw::NormalLaw;
}

// Compute this computer's lateral law capability, i.e.
// the "highest" lateral law that can be engaged on the lateral axis by this computer
void Elac::computeLateralLawCapability() {
  // Placeholder
  lateralLawCapability = LateralLaw::NormalLaw;
}

// Compute the laws that are actually active.
void Elac::computeActiveLawsAndFunctionStatus() {
  // Compute the capabilities of the opposite ELAC
  PitchLaw oppElacPitchCapability;
  bool oppElacPitchCapBit1 = busInputs.elacOpp.discreteStatusWord2.bitFromValueOr(11, false);
  bool oppElacPitchCapBit2 = busInputs.elacOpp.discreteStatusWord2.bitFromValueOr(12, false);
  if (oppElacPitchCapBit1 && !oppElacPitchCapBit2) {
    oppElacPitchCapability = PitchLaw::NormalLaw;
  } else if (!oppElacPitchCapBit1 && oppElacPitchCapBit2) {
    oppElacPitchCapability = PitchLaw::AlternateLaw1;
  } else if (oppElacPitchCapBit1 && oppElacPitchCapBit2) {
    oppElacPitchCapability = PitchLaw::DirectLaw;
  } else if (!oppElacPitchCapBit1 && !oppElacPitchCapBit2) {
    oppElacPitchCapability = PitchLaw::None;
  }

  LateralLaw oppElacRollCapability;
  bool oppElacLateralCapBit1 = busInputs.elacOpp.discreteStatusWord2.bitFromValueOr(13, false);
  bool oppElacLateralCapBit2 = busInputs.elacOpp.discreteStatusWord2.bitFromValueOr(14, false);
  if (oppElacPitchCapBit1 && !oppElacPitchCapBit2) {
    oppElacRollCapability = LateralLaw::NormalLaw;
  } else if (!oppElacPitchCapBit1 && oppElacPitchCapBit2) {
    oppElacRollCapability = LateralLaw::DirectLaw;
  } else if (!oppElacPitchCapBit1 && !oppElacPitchCapBit2) {
    oppElacRollCapability = LateralLaw::None;
  }

  // Compute the capabilities of the computer that has priority in the different Axes
  PitchLaw priorityPitchPitchLawCap;
  LateralLaw priorityPitchLateralLawCap;

  LateralLaw priorityLateralLateralLawCap;

  if (hasPriorityInPitch && isEngagedInPitch) {
    priorityPitchPitchLawCap = pitchLawCapability;
    priorityPitchLateralLawCap = lateralLawCapability;
  } else if (!hasPriorityInPitch || !isEngagedInPitch) {
    priorityPitchPitchLawCap = oppElacPitchCapability;
    priorityPitchLateralLawCap = oppElacRollCapability;
  }

  if (hasPriorityInRoll && isEngagedInRoll) {
    priorityLateralLateralLawCap = lateralLawCapability;
  } else if (!hasPriorityInPitch || !isEngagedInPitch) {
    priorityLateralLateralLawCap = oppElacRollCapability;
  }

  // Compute own law statuses

  // If this computer is engaged in roll, then the lateral normal law can be engaged if and only if the computer that has priority in roll
  // (itself) has the capability to engage the lateral normal law, and the computer that has priority in pitch (either itself or the
  // opposite ELAC, if it is a SEC, then normal law cannot be engaged anyways) can engage both lateral and pitch normal laws.
  // If these conditions are not given, engage direct roll law.
  // If this computer is not engaged in roll, set active lateral law to None.
  if (isEngagedInRoll && priorityLateralLateralLawCap == LateralLaw::NormalLaw && priorityPitchPitchLawCap == PitchLaw::NormalLaw &&
      priorityPitchLateralLawCap == LateralLaw::NormalLaw) {
    activeLateralLaw = LateralLaw::NormalLaw;
  } else if (isEngagedInRoll && (priorityLateralLateralLawCap != LateralLaw::NormalLaw || priorityPitchPitchLawCap != PitchLaw::NormalLaw ||
                                 priorityPitchLateralLawCap != LateralLaw::NormalLaw)) {
    activeLateralLaw = LateralLaw::DirectLaw;
  } else if (!isEngagedInRoll) {
    activeLateralLaw = LateralLaw::None;
  }

  // If this computer is engaged in pitch, then the pitch normal law can be engaged if and only if the computer that has priority
  // (itself) has the capability to engage both the lateral and pitch normal laws, and the computer that has priority in roll (either itself
  // or the opposite ELAC) can engage lateral normal law.
  // If the ELAC which has priority in roll cannot engage normal law, but this computer can engage pitch normal law, then engage pitch
  // alternate law 1, or, if this computer cannot engage pitch normal law, engage the actual pitch law capability. If this computer is not
  // engaged in pitch, set active pitch law to None.
  if (isEngagedInPitch && priorityLateralLateralLawCap == LateralLaw::NormalLaw && priorityPitchPitchLawCap == PitchLaw::NormalLaw &&
      priorityPitchLateralLawCap == LateralLaw::NormalLaw) {
    activePitchLaw = PitchLaw::NormalLaw;
  } else if (isEngagedInPitch && priorityLateralLateralLawCap != LateralLaw::NormalLaw) {
    activePitchLaw = pitchLawCapability == PitchLaw::NormalLaw ? PitchLaw::AlternateLaw1 : pitchLawCapability;
  } else if (!isEngagedInPitch) {
    activePitchLaw = PitchLaw::None;
  }
}

// Compute this computers ability to drive in the pitch axis.
// It can drive in pitch, if the computer is healthy, all 3 pitch servoloops are healthy,
// the assosciated hydraulics are powered, and the peripheral sensors permit engagement.
// Also compute if the computer should be engaged in pitch. It should be engaged in pitch,
// if it can drive in pitch, and it has priority in pitch.
void Elac::computeComputerEngagementPitch() {
  bool allServoloopsHealthy = !discreteInputs.rElevServoFailed && !discreteInputs.lElevServoFailed && !discreteInputs.thsMotorFault;
  leftElevatorAvail = !discreteInputs.lElevServoFailed && (isUnit1 ? isBlueHydraulicPowerAvail : isGreenHydraulicPowerAvail);
  rightElevatorAvail = !discreteInputs.rElevServoFailed && (isUnit1 ? isBlueHydraulicPowerAvail : isYellowHydraulicPowerAvail);
  bool hydraulicsPowered;
  if (isUnit1) {
    hydraulicsPowered = isBlueHydraulicPowerAvail;
  } else {
    hydraulicsPowered = (isYellowHydraulicPowerAvail && isGreenHydraulicPowerAvail) ||
                        (!isBlueHydraulicPowerAvail && (isGreenHydraulicPowerAvail || isYellowHydraulicPowerAvail));
  }

  canEngageInPitch = monitoringHealthy && allServoloopsHealthy && hydraulicsPowered;

  // TODO Peripheral sensor status is not yet included here
  if (isUnit1) {
    hasPriorityInPitch = discreteInputs.oppPitchAxisFailure;
  } else {
    hasPriorityInPitch = true;
  }

  isEngagedInPitch = canEngageInPitch && hasPriorityInPitch;
}

// Compute this computers ability to drive in the roll axis.
// It can drive in roll, if the computer is healthy, at least one aileron servoloop is healthy,
// the assosciated hydraulics are powered, and the peripheral sensors permit engagement.
// Also compute if the computer should be engaged in roll. It should be engaged in roll,
// if it can drive in roll, and it has priority in roll.
void Elac::computeComputerEngagementRoll() {
  leftAileronAvail = !discreteInputs.lAilServoFailed && (isUnit1 ? isBlueHydraulicPowerAvail : isGreenHydraulicPowerAvail);
  rightAileronAvail = !discreteInputs.rAilServoFailed && (isUnit1 ? isGreenHydraulicPowerAvail : isBlueHydraulicPowerAvail);

  canEngageInRoll = monitoringHealthy && (leftAileronAvail || rightAileronAvail);

  // TODO Peripheral sensor status is not yet included here
  if (isUnit1) {
    hasPriorityInRoll = true;
  } else {
    hasPriorityInRoll = discreteInputs.oppLeftAileronLost && discreteInputs.oppRightAileronLost;
  }

  isEngagedInRoll = canEngageInRoll && hasPriorityInRoll;
}

// Compute hydraulic loop availabilities from different sensor sources
void Elac::monitorHydraulicData() {
  if (!discreteInputs.yellowLowPressure && analogInputs.yellowHydPressure > 1450) {
    isYellowHydraulicPowerAvail = true;
  } else {
    isYellowHydraulicPowerAvail = false;
  }

  if (!discreteInputs.blueLowPressure && analogInputs.blueHydPressure > 1450) {
    isBlueHydraulicPowerAvail = true;
  } else {
    isBlueHydraulicPowerAvail = false;
  }

  if (!discreteInputs.greenLowPressure && analogInputs.greenHydPressure > 1450) {
    isGreenHydraulicPowerAvail = true;
  } else {
    isGreenHydraulicPowerAvail = false;
  }
}

// Perform self monitoring
void Elac::monitorSelf(bool faultActive) {
  if (faultActive || powerSupplyFault || !selfTestComplete || !discreteInputs.elacEngagedFromSwitch) {
    monitoringHealthy = false;
  } else {
    monitoringHealthy = true;
  }
}

// Monitor the overhead button position. If the button was switched off, and is now on,
// begin self-tests.
void Elac::monitorButtonStatus() {
  if (discreteInputs.elacEngagedFromSwitch && !prevEngageButtonWasPressed) {
    initSelfTests(true);
  }
  prevEngageButtonWasPressed = discreteInputs.elacEngagedFromSwitch;
}

// Monitor the power supply and record the outage time (used for self test and healthy logic).
// If an outage lasts more than 10ms, stop the program execution.
// If the power has been restored after an outage that lasted longer than 10ms, reset the RAM and
// perform the startup sequence.
void Elac::monitorPowerSupply(double deltaTime, bool isPowered) {
  if (!isPowered) {
    powerSupplyOutageTime += deltaTime;
  }
  if (powerSupplyOutageTime > minimumPowerOutageTimeForFailure) {
    powerSupplyFault = true;
  }
  if (isPowered && powerSupplyFault) {
    powerSupplyFault = false;
    initSelfTests(false);
    powerSupplyOutageTime = 0;
  }
}

// Update the Self-test-Sequence
void Elac::updateSelfTest(double deltaTime) {
  if (selfTestTimer > 0) {
    selfTestTimer -= deltaTime;

    // If the self-test sequence has just been completed, reset RAM.
    if (selfTestTimer <= 0) {
      clearMemory();
    }
  }
  if (selfTestTimer <= 0) {
    selfTestComplete = true;
  } else {
    selfTestComplete = false;
  }
}

// Write the bus output data and return it.
ElacOutBus Elac::getBusOutputs() {
  ElacOutBus output = {};

  if (!monitoringHealthy) {
    output.leftAileronPosition.setSsm(Arinc429SignStatus::FailureWarning);
    output.rightAileronPosition.setSsm(Arinc429SignStatus::FailureWarning);
    output.leftElevatorPosition.setSsm(Arinc429SignStatus::FailureWarning);
    output.rightElevatorPosition.setSsm(Arinc429SignStatus::FailureWarning);
    output.thsPosition.setSsm(Arinc429SignStatus::FailureWarning);
    output.aileronCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.rollSpoilerCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.yawDamperCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.discreteStatusWord1.setSsm(Arinc429SignStatus::FailureWarning);
    output.discreteStatusWord2.setSsm(Arinc429SignStatus::FailureWarning);

    return output;
  }

  if (discreteInputs.lAilServoFailed) {
    output.leftAileronPosition.setFromData(0, Arinc429SignStatus::NoComputedData);
  } else {
    output.leftAileronPosition.setFromData(analogInputs.leftAileronPos, Arinc429SignStatus::NormalOperation);
  }
  if (discreteInputs.rAilServoFailed) {
    output.rightAileronPosition.setFromData(0, Arinc429SignStatus::NoComputedData);
  } else {
    output.rightAileronPosition.setFromData(analogInputs.rightAileronPos, Arinc429SignStatus::NormalOperation);
  }

  if (discreteInputs.lElevServoFailed) {
    output.leftElevatorPosition.setFromData(0, Arinc429SignStatus::NoComputedData);
  } else {
    output.leftElevatorPosition.setFromData(analogInputs.leftElevatorPos, Arinc429SignStatus::NormalOperation);
  }
  if (discreteInputs.rElevServoFailed) {
    output.rightElevatorPosition.setFromData(0, Arinc429SignStatus::NoComputedData);
  } else {
    output.rightElevatorPosition.setFromData(analogInputs.rightElevatorPos, Arinc429SignStatus::NormalOperation);
  }
  if (discreteInputs.thsMotorFault) {
    output.thsPosition.setFromData(0, Arinc429SignStatus::NoComputedData);
  } else {
    output.thsPosition.setFromData(analogInputs.thsPos, Arinc429SignStatus::NormalOperation);
  }

  output.aileronCommand.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.rollSpoilerCommand.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.yawDamperCommand.setFromData(0, Arinc429SignStatus::NormalOperation);

  output.discreteStatusWord1.setSsm(Arinc429SignStatus::NormalOperation);
  output.discreteStatusWord1.setBit(11, discreteInputs.lAilServoFailed);
  output.discreteStatusWord1.setBit(12, discreteInputs.rAilServoFailed);
  output.discreteStatusWord1.setBit(13, discreteInputs.lElevServoFailed);
  output.discreteStatusWord1.setBit(14, discreteInputs.rElevServoFailed);
  output.discreteStatusWord1.setBit(15, leftAileronAvail);
  output.discreteStatusWord1.setBit(16, rightAileronAvail);
  output.discreteStatusWord1.setBit(17, leftElevatorAvail);
  output.discreteStatusWord1.setBit(18, rightElevatorAvail);
  output.discreteStatusWord1.setBit(19, isEngagedInPitch);
  output.discreteStatusWord1.setBit(20, isEngagedInRoll);
  output.discreteStatusWord1.setBit(21, !canEngageInPitch);
  output.discreteStatusWord1.setBit(22, !canEngageInRoll);
  output.discreteStatusWord1.setBit(23, activePitchLaw == PitchLaw::NormalLaw || activePitchLaw == PitchLaw::AlternateLaw2);
  output.discreteStatusWord1.setBit(24, activePitchLaw == PitchLaw::AlternateLaw1 || activePitchLaw == PitchLaw::AlternateLaw2);
  output.discreteStatusWord1.setBit(25, activePitchLaw == PitchLaw::DirectLaw);
  output.discreteStatusWord1.setBit(26, activeLateralLaw == LateralLaw::NormalLaw);
  output.discreteStatusWord1.setBit(27, activeLateralLaw == LateralLaw::DirectLaw);
  output.discreteStatusWord1.setBit(28, false);
  output.discreteStatusWord1.setBit(29, false);

  output.discreteStatusWord2.setSsm(Arinc429SignStatus::NormalOperation);
  output.discreteStatusWord2.setBit(11, activePitchLaw == PitchLaw::NormalLaw || activePitchLaw == PitchLaw::DirectLaw);
  output.discreteStatusWord2.setBit(
      12, activePitchLaw == PitchLaw::AlternateLaw1 || activePitchLaw == PitchLaw::AlternateLaw2 || activePitchLaw == PitchLaw::DirectLaw);
  output.discreteStatusWord2.setBit(13, lateralLawCapability == LateralLaw::NormalLaw);
  output.discreteStatusWord2.setBit(14, lateralLawCapability == LateralLaw::DirectLaw);
  output.discreteStatusWord2.setBit(15, false);
  output.discreteStatusWord2.setBit(16, false);
  output.discreteStatusWord2.setBit(17, false);
  output.discreteStatusWord2.setBit(18, false);
  output.discreteStatusWord2.setBit(19, false);
  output.discreteStatusWord2.setBit(20, false);

  return output;
}

// Write the discrete output data and return it.
ElacDiscreteOutputs Elac::getDiscreteOutputs() {
  ElacDiscreteOutputs output = {};

  output.digitalOperationValidated = monitoringHealthy;
  if (!monitoringHealthy) {
    output.pitchAxisOk = false;
    output.leftAileronOk = false;
    output.rightAileronOk = false;
    output.ap1Authorised = false;
    output.ap2Authorised = false;
    output.leftAileronActiveMode = false;
    output.rightAileronActiveMode = false;
    output.leftElevatorActiveMode = false;
    output.rightElevatorActiveMode = false;
    output.thsActive = false;
  } else {
    output.pitchAxisOk = canEngageInPitch;
    output.leftAileronOk = leftAileronAvail;
    output.rightAileronOk = rightAileronAvail;
    output.ap1Authorised = false;
    output.ap2Authorised = false;
    output.leftAileronActiveMode = isEngagedInRoll && leftAileronAvail;
    output.rightAileronActiveMode = isEngagedInRoll && rightAileronAvail;
    output.leftElevatorActiveMode = isEngagedInPitch && leftElevatorAvail;
    output.rightElevatorActiveMode = isEngagedInPitch && rightElevatorAvail;
    output.thsActive = isEngagedInPitch && !discreteInputs.thsMotorFault;
  }

  return output;
}

// Write the analog outputs and return it.
ElacAnalogOutputs Elac::getAnalogOutputs() {
  ElacAnalogOutputs output = {};

  if (!monitoringHealthy) {
    output.leftElevPosOrder = 0;
    output.rightElevPosOrder = 0;
    output.thsPosOrder = 0;
    output.leftAileronPosOrder = 0;
    output.rightAileronPosOrder = 0;
  } else {
    output.leftElevPosOrder = 0;
    output.rightElevPosOrder = 0;
    output.thsPosOrder = 0;
    output.leftAileronPosOrder = 0;
    output.rightAileronPosOrder = 0;
  }

  return output;
}
