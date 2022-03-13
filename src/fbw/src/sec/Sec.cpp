#include "Sec.h"
#include <iostream>

Sec::Sec(bool isUnit1, bool isUnit3) : isUnit1(isUnit1), isUnit3(isUnit3) {}

// If the power supply is valid, perform the self-test-sequence.
// If at least one hydraulic source is pressurised, perform a short test.
// If no hydraulic supply is pressurised, and the outage was more than 3 seconds (or the switch was turned off),
// perform a long selft-test.
// Else, perform a short self-test.
void Sec::initSelfTests() {
  if (powerSupplyFault)
    return;

  clearMemory();
  selfTestTimer = selfTestDuration;
}

// After the self-test is complete, erase all data in RAM.
void Sec::clearMemory() {
  isEngagedInPitch = false;
  canEngageInPitch = false;
  hasPriorityInPitch = false;
  leftElevatorAvail = false;
  rightElevatorAvail = false;
  thsAvail = false;
  isEngagedInRoll = false;
  spoilerPair1Avail = false;
  spoilerPair2Avail = false;
  pitchLawCapability = PitchLaw::None;
  activePitchLaw = PitchLaw::None;
}

// Main update cycle. Surface position through parameters here is temporary.
void Sec::update(double deltaTime, double simulationTime, bool faultActive, bool isPowered, double surfaceCommands[4]) {
  monitorPowerSupply(deltaTime, isPowered);

  updateSelfTest(deltaTime);
  monitorSelf(faultActive);

  if (monitoringHealthy) {
    computeSidestickPriorityLogic(deltaTime);
    computeComputerEngagementRoll();
    computeComputerEngagementPitch();
    computePitchLawCapability();
    computeActiveLawsAndFunctionStatus();
    computeSurfaceSlaving(surfaceCommands);
  }
}

// Compute the priority logic. The last pilot to press the takeover button,
// gets priority. Holding the button for more than 30s locks in the priority.
// A locked sidestick can be reactivated by pressing it's takeover button again.
// If the AP is currently engaged, the takeover button will act as the instinctive
// disconnect button, so it's function as the takeover button is disabled as long as
// at least one AP is engaged. An already locked priority will remain locked however.
// TODO:
// Also, if a different computer is engaged in an axis, synchronize with this
// computer, in order to prevent one computer having a sidestick locked while the other doesn't.
void Sec::computeSidestickPriorityLogic(double deltaTime) {
  bool leftButtonPulsed = leftTakeoverPulseNode.update(discreteInputs.captPriorityTakeoverPressed);
  bool rightButtonPulsed = rightTakeoverPulseNode.update(discreteInputs.foPriorityTakeoverPressed);

  if (leftButtonPulsed) {
    rightSidestickDisabled = true;
    leftSidestickDisabled = false;
  } else if (rightButtonPulsed) {
    leftSidestickDisabled = true;
    rightSidestickDisabled = false;
  }

  if (rightSidestickDisabled && !(discreteInputs.captPriorityTakeoverPressed || rightSidestickPriorityLocked)) {
    rightSidestickDisabled = false;
  }
  if (leftSidestickDisabled && !(discreteInputs.foPriorityTakeoverPressed || leftSidestickPriorityLocked)) {
    leftSidestickDisabled = false;
  }

  leftSidestickPriorityLocked = leftPriorityLockConfirmNode.update(
      leftSidestickDisabled && (discreteInputs.foPriorityTakeoverPressed || leftSidestickPriorityLocked), deltaTime);
  rightSidestickPriorityLocked = rightPriorityLockConfirmNode.update(
      rightSidestickDisabled && (discreteInputs.captPriorityTakeoverPressed || rightSidestickPriorityLocked), deltaTime);
}

// Compute the laws that are actually active.
void Sec::computeActiveLawsAndFunctionStatus() {
  if (isEngagedInPitch) {
    activePitchLaw = pitchLawCapability;
  } else {
    activePitchLaw = PitchLaw::None;
  }
}

// Compute this computer's pitch law capability, i.e.
// the "highest" pitch law that can be engaged on the pitch axis by this computer
void Sec::computePitchLawCapability() {
  // Placeholder
  pitchLawCapability = PitchLaw::AlternateLaw1;
}

// Compute spoiler pair availability. A spoiler pair is available, if both spoilers of the pair are not failed,
// and the assosciated hydraulic supplies are available.
// Also compute the engagement of the computers in roll (i.e. if the computer should actively compute the direct law,
// or execute roll spoiler orders from the ELAC). It should be engaged in roll, if at least one spoiler pair is
// available, and both ELACs are either failed or no longer output a roll spoiler command.
void Sec::computeComputerEngagementRoll() {
  bool spoilerPair1NotFailed = !discreteInputs.lSpoiler1ServoFailed && !discreteInputs.rSpoiler1ServoFailed;
  bool spoilerPair2NotFailed = !discreteInputs.lSpoiler2ServoFailed && !discreteInputs.rSpoiler2ServoFailed;

  bool spoilerPair1SupplyAvail;
  bool spoilerPair2SupplyAvail;

  if (isUnit1 && !isUnit3) {
    spoilerPair1SupplyAvail = !discreteInputs.blueLowPressure;
    spoilerPair2SupplyAvail = !discreteInputs.yellowLowPressure;
  } else if (!isUnit1 && !isUnit3) {
    spoilerPair1SupplyAvail = !discreteInputs.greenLowPressure;
    spoilerPair2SupplyAvail = false;
  } else {
    spoilerPair1SupplyAvail = !discreteInputs.greenLowPressure;
    spoilerPair2SupplyAvail = !discreteInputs.yellowLowPressure;
  }

  spoilerPair1Avail = spoilerPair1NotFailed && spoilerPair1SupplyAvail;
  spoilerPair2Avail = spoilerPair2NotFailed && spoilerPair2SupplyAvail;

  isEngagedInRoll = (spoilerPair1Avail || spoilerPair2Avail) &&
                    ((discreteInputs.digitalOutputFailedElac1 && discreteInputs.digitalOutputFailedElac2) ||
                     (!busInputs.elac1.rollSpoilerCommand.isNo() && !busInputs.elac2.rollSpoilerCommand.isNo()));
}

// Compute this computers ability to drive in the pitch axis.
// It can drive in pitch, if the computer is healthy, and at least one pitch servoloops is healthy,
// the assosciated hydraulics are powered, and the peripheral sensors permit engagement.
// Also compute if the computer should be engaged in pitch. It should be engaged in pitch,
// if it can drive in pitch, and it has priority in pitch.
void Sec::computeComputerEngagementPitch() {
  leftElevatorAvail = !discreteInputs.lElevServoFailed && (isUnit1 ? !discreteInputs.blueLowPressure : !discreteInputs.greenLowPressure);
  rightElevatorAvail = !discreteInputs.rElevServoFailed && (isUnit1 ? !discreteInputs.blueLowPressure : !discreteInputs.yellowLowPressure);
  thsAvail = !discreteInputs.thsMotorFault && (!discreteInputs.greenLowPressure || !discreteInputs.yellowLowPressure);

  canEngageInPitch = monitoringHealthy && (leftElevatorAvail || rightElevatorAvail || thsAvail) && !isUnit3;

  // TODO Peripheral sensor status is not yet included here
  if (isUnit1 && !isUnit3) {
    hasPriorityInPitch = discreteInputs.pitchNotAvailElac1 && discreteInputs.pitchNotAvailElac2 && discreteInputs.leftElevNotAvailSecOpp &&
                         discreteInputs.rightElevNotAvailSecOpp;
  } else if (!isUnit1 && !isUnit3) {
    hasPriorityInPitch = discreteInputs.pitchNotAvailElac1 && discreteInputs.pitchNotAvailElac2;
  } else {
    hasPriorityInPitch = false;
  }

  isEngagedInPitch = canEngageInPitch && hasPriorityInPitch;
}

// Compute the various surface slaving commands from the law outputs. (the law outputs come from outside the computer atm)
void Sec::computeSurfaceSlaving(double surfaceCommands[4]) {
  if (isEngagedInPitch && leftElevatorAvail) {
    leftElevPosCommand = surfaceCommands[0] > 0 ? -surfaceCommands[0] * 30 : -surfaceCommands[0] * 19;
  } else {
    leftElevPosCommand = 0;
  }

  if (isEngagedInPitch && rightElevatorAvail) {
    rightElevPosCommand = surfaceCommands[0] > 0 ? -surfaceCommands[0] * 30 : -surfaceCommands[0] * 19;
  } else {
    rightElevPosCommand = 0;
  }

  if (isEngagedInPitch && thsAvail) {
    thsPosCommand = surfaceCommands[1];

  } else {
    thsPosCommand = 0;
  }
}

// Perform self monitoring. If
void Sec::monitorSelf(bool faultActive) {
  cpuStopped = cpuStoppedFlipFlop.update(faultActive || powerSupplyFault, cpuStopped && selfTestComplete && !powerSupplyFault);

  bool shouldReset = cpuStopped && resetPulseNode.update(discreteInputs.secEngagedFromSwitch) && !powerSupplyFault;
  if (shouldReset) {
    initSelfTests();
  }

  monitoringHealthy = !cpuStopped && !powerSupplyFault && discreteInputs.secEngagedFromSwitch;
}

// Monitor the power supply and record the outage time (used for self test and healthy logic).
// If an outage lasts more than 10ms, stop the program execution.
// If the power has been restored after an outage that lasted longer than 10ms, reset the RAM and
// perform the startup sequence.
void Sec::monitorPowerSupply(double deltaTime, bool isPowered) {
  if (!isPowered) {
    powerSupplyOutageTime += deltaTime;
  }
  if (powerSupplyOutageTime > minimumPowerOutageTimeForFailure) {
    powerSupplyFault = true;
  }
  if (isPowered && powerSupplyFault) {
    powerSupplyFault = false;
    initSelfTests();
    powerSupplyOutageTime = 0;
  }
}

// Update the Self-test-Sequence
void Sec::updateSelfTest(double deltaTime) {
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
SecOutBus Sec::getBusOutputs() {
  SecOutBus output = {};

  if (!monitoringHealthy) {
    output.leftSpoiler1Position.setSsm(Arinc429SignStatus::FailureWarning);
    output.rightSpoiler1Position.setSsm(Arinc429SignStatus::FailureWarning);
    output.leftSpoiler2Position.setSsm(Arinc429SignStatus::FailureWarning);
    output.rightSpoiler2Position.setSsm(Arinc429SignStatus::FailureWarning);
    output.leftElevatorPosition.setSsm(Arinc429SignStatus::FailureWarning);
    output.rightElevatorPosition.setSsm(Arinc429SignStatus::FailureWarning);
    output.thsPosition.setSsm(Arinc429SignStatus::FailureWarning);
    output.leftSidestickPitchCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.rightSidestickPitchCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.leftSidestickRollCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.rightSidestickRollCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.speedBrakeLeverCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.discreteStatusWord1.setSsm(Arinc429SignStatus::FailureWarning);
    output.discreteStatusWord2.setSsm(Arinc429SignStatus::FailureWarning);

    return output;
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

  if (discreteInputs.lSpoiler1ServoFailed) {
    output.leftSpoiler1Position.setFromData(0, Arinc429SignStatus::NoComputedData);
  } else {
    output.leftSpoiler1Position.setFromData(analogInputs.leftSpoiler1Pos, Arinc429SignStatus::NormalOperation);
  }
  if (discreteInputs.rSpoiler1ServoFailed) {
    output.rightSpoiler1Position.setFromData(0, Arinc429SignStatus::NoComputedData);
  } else {
    output.rightSpoiler1Position.setFromData(analogInputs.rightSpoiler1Pos, Arinc429SignStatus::NormalOperation);
  }

  if (discreteInputs.lSpoiler2ServoFailed || (!isUnit1 && !isUnit3)) {
    output.leftSpoiler2Position.setFromData(0, Arinc429SignStatus::NoComputedData);
  } else {
    output.leftSpoiler2Position.setFromData(analogInputs.leftSpoiler2Pos, Arinc429SignStatus::NormalOperation);
  }
  if (discreteInputs.rSpoiler2ServoFailed || (!isUnit1 && !isUnit3)) {
    output.rightSpoiler2Position.setFromData(0, Arinc429SignStatus::NoComputedData);
  } else {
    output.rightSpoiler2Position.setFromData(analogInputs.rightSpoiler2Pos, Arinc429SignStatus::NormalOperation);
  }

  output.leftSidestickPitchCommand.setFromData(analogInputs.capPitchStickPos, Arinc429SignStatus::NormalOperation);
  output.rightSidestickPitchCommand.setFromData(analogInputs.foPitchStickPos, Arinc429SignStatus::NormalOperation);
  output.leftSidestickRollCommand.setFromData(analogInputs.capRollStickPos, Arinc429SignStatus::NormalOperation);
  output.rightSidestickRollCommand.setFromData(analogInputs.foRollStickPos, Arinc429SignStatus::NormalOperation);
  output.speedBrakeLeverCommand.setFromData(analogInputs.spdBrkLeverPos, Arinc429SignStatus::NormalOperation);

  output.discreteStatusWord1.setSsm(Arinc429SignStatus::NormalOperation);
  output.discreteStatusWord1.setBit(11, discreteInputs.lSpoiler1ServoFailed || discreteInputs.rSpoiler1ServoFailed);
  output.discreteStatusWord1.setBit(12, discreteInputs.lSpoiler2ServoFailed || discreteInputs.rSpoiler2ServoFailed);
  output.discreteStatusWord1.setBit(13, discreteInputs.lElevServoFailed);
  output.discreteStatusWord1.setBit(14, discreteInputs.rElevServoFailed);
  output.discreteStatusWord1.setBit(15, spoilerPair1Avail);
  output.discreteStatusWord1.setBit(16, spoilerPair2Avail);
  output.discreteStatusWord1.setBit(17, leftElevatorAvail);
  output.discreteStatusWord1.setBit(18, rightElevatorAvail);
  output.discreteStatusWord1.setBit(19, activePitchLaw == PitchLaw::AlternateLaw2);
  output.discreteStatusWord1.setBit(20, activePitchLaw == PitchLaw::AlternateLaw1 || activePitchLaw == PitchLaw::AlternateLaw2);
  output.discreteStatusWord1.setBit(21, activePitchLaw == PitchLaw::DirectLaw);
  output.discreteStatusWord1.setBit(22, isEngagedInRoll);
  output.discreteStatusWord1.setBit(23, isEngagedInPitch);
  output.discreteStatusWord1.setBit(24, false);
  output.discreteStatusWord1.setBit(25, false);
  output.discreteStatusWord1.setBit(26, false);
  output.discreteStatusWord1.setBit(27, false);
  output.discreteStatusWord1.setBit(28, false);
  output.discreteStatusWord1.setBit(29, false);

  output.discreteStatusWord2.setSsm(Arinc429SignStatus::NormalOperation);
  output.discreteStatusWord2.setBit(11, false);
  output.discreteStatusWord2.setBit(12, false);
  output.discreteStatusWord2.setBit(13, leftSidestickDisabled);
  output.discreteStatusWord2.setBit(14, rightSidestickDisabled);
  output.discreteStatusWord2.setBit(15, leftSidestickPriorityLocked);
  output.discreteStatusWord2.setBit(16, rightSidestickPriorityLocked);

  return output;
}

// Write the discrete output data and return it.
SecDiscreteOutputs Sec::getDiscreteOutputs() {
  SecDiscreteOutputs output = {};

  output.secFailed = !monitoringHealthy;
  if (!monitoringHealthy) {
    output.thrReverseSelected = false;
    output.leftElevOk = false;
    output.rightElevOk = false;
    output.groundSpoilerOut = false;
    output.leftElevatorDampingMode = false;
    output.rightElevatorDampingMode = false;
    output.thsActive = false;
  } else {
    output.thrReverseSelected = false;
    output.leftElevOk = leftElevatorAvail;
    output.rightElevOk = rightElevatorAvail;
    output.groundSpoilerOut = false;
    output.leftElevatorDampingMode = isEngagedInPitch && leftElevatorAvail;
    output.rightElevatorDampingMode = isEngagedInPitch && rightElevatorAvail;
    output.thsActive = isEngagedInPitch && !discreteInputs.thsMotorFault;
  }

  return output;
}

// Write the analog outputs and return it.
SecAnalogOutputs Sec::getAnalogOutputs() {
  SecAnalogOutputs output = {};

  if (!monitoringHealthy) {
    output.leftElevPosOrder = 0;
    output.rightElevPosOrder = 0;
    output.thsPosOrder = 0;
    output.leftSpoiler1Order = 0;
    output.rightSpoiler1Order = 0;
    output.leftSpoiler2Order = 0;
    output.rightSpoiler2Order = 0;
  } else {
    output.leftElevPosOrder = leftElevPosCommand;
    output.rightElevPosOrder = rightElevPosCommand;
    output.thsPosOrder = thsPosCommand;
    output.leftSpoiler1Order = leftSpoiler1PosCommand;
    output.rightSpoiler1Order = rightSpoiler1PosCommand;
    output.leftSpoiler2Order = leftSpoiler2PosCommand;
    output.rightSpoiler2Order = rightSpoiler2PosCommand;
  }

  return output;
}
