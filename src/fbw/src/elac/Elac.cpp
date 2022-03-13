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
  leftAileronCrossCommandActive = false;
  rightAileronCrossCommandActive = false;
  leftAileronAvail = false;
  rightAileronAvail = false;
  lateralLawCapability = LateralLaw::None;
  activeLateralLaw = LateralLaw::None;
  pitchLawCapability = PitchLaw::None;
  activePitchLaw = PitchLaw::None;
  leftSidestickDisabled = false;
  rightSidestickDisabled = false;
  leftSidestickPriorityLocked = false;
  rightSidestickPriorityLocked = false;
  leftTakeoverPulseNode.update(false);
  rightTakeoverPulseNode.update(false);
  leftPriorityLockConfirmNode.update(false, 0);
  rightPriorityLockConfirmNode.update(false, 0);
  ra1Invalid = false;
  ra2Invalid = false;
  ra1CoherenceRejected = false;
  ra2CoherenceRejected = false;
  leftElevPosCommand = 0;
  rightElevPosCommand = 0;
  thsPosCommand = 0;
  leftAileronPosCommand = 0;
  rightAileronPosCommand = 0;
}

// Main update cycle. Surface position through parameters here is temporary.
void Elac::update(double deltaTime, double simulationTime, bool faultActive, bool isPowered, double surfaceCommands[4]) {
  monitorPowerSupply(deltaTime, isPowered);
  monitorButtonStatus();

  updateSelfTest(deltaTime);
  monitorSelf(faultActive);

  if (monitoringHealthy) {
    monitorRa(deltaTime);
    computeSidestickPriorityLogic(deltaTime);
    monitorHydraulicData();
    computeComputerEngagementPitch();
    computeComputerEngagementRoll();
    computeLateralLawCapability();
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
// Also, if a different computer (ELAC or SEC) is engaged in an axis, synchronize with this
// computer, in order to prevent one computer having a sidestick locked while the other doesn't.
void Elac::computeSidestickPriorityLogic(double deltaTime) {
  bool leftButtonPulsed = leftTakeoverPulseNode.update(discreteInputs.captPriorityTakeoverPressed) && discreteInputs.ap1Disengaged &&
                          discreteInputs.ap2Disengaged;
  bool rightButtonPulsed = rightTakeoverPulseNode.update(discreteInputs.foPriorityTakeoverPressed) && discreteInputs.ap1Disengaged &&
                           discreteInputs.ap2Disengaged;

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

// Compute this computer's pitch law capability, i.e.
// the "highest" pitch law that can be engaged on the pitch axis by this computer
void Elac::computePitchLawCapability() {
  // Placeholder
  pitchLawCapability = PitchLaw::NormalLaw;
}

// Compute this computer's lateral law capability, i.e.
// the "highest" lateral law that can be engaged on the lateral axis by this computer
void Elac::computeLateralLawCapability() {
  // TODO add missing conditions
  lateralLawCapability = LateralLaw::NormalLaw;
  if (discreteInputs.fac1YawControlLost && discreteInputs.fac2YawControlLost) {
    lateralLawCapability = LateralLaw::DirectLaw;
  }
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
// Also, if this computer is ELAC 2, and is not engaged in roll, and the ELAC 1 has lost
// exactly one aileron, then engage this ELACs aileron servo on that side, and control it
// via commands from the ELAC 1.
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

  if (!isUnit1 && !hasPriorityInRoll && busInputs.elacOpp.aileronCommand.isNo()) {
    leftAileronCrossCommandActive = discreteInputs.oppLeftAileronLost && leftAileronAvail;
    rightAileronCrossCommandActive = discreteInputs.oppRightAileronLost && rightAileronAvail;
  } else {
    leftAileronCrossCommandActive = false;
    rightAileronCrossCommandActive = false;
  }

  isEngagedInRoll = canEngageInRoll && hasPriorityInRoll;
}

// Compute the various surface slaving commands from the law outputs. (the law outputs come from outside the computer atm)
void Elac::computeSurfaceSlaving(double surfaceCommands[4]) {
  if (isEngagedInPitch) {
    leftElevPosCommand = surfaceCommands[0] > 0 ? -surfaceCommands[0] * 30 : -surfaceCommands[0] * 19;
    rightElevPosCommand = surfaceCommands[0] > 0 ? -surfaceCommands[0] * 30 : -surfaceCommands[0] * 19;
    thsPosCommand = surfaceCommands[1];
  } else {
    leftElevPosCommand = 0;
    rightElevPosCommand = 0;
    thsPosCommand = 0;
  }

  if ((isEngagedInRoll || leftAileronCrossCommandActive) && leftAileronAvail) {
    leftAileronPosCommand = surfaceCommands[2] * 25;
  } else {
    leftAileronPosCommand = 0;
  }
  if ((isEngagedInRoll || rightAileronCrossCommandActive) && rightAileronAvail) {
    rightAileronPosCommand = surfaceCommands[3] * 25;
  } else {
    rightAileronPosCommand = 0;
  }
}

// Monitor the RA inputs. Monitoring is performed in 3 different ways: SSM and refresh monitoring of the bus,
// Coherence monitoring, and Data validation through comparison.
// If an RA reports Failure Warning, it is no longer used for computation and declared as invalid.
// If the Coherence test fails (RA < 50ft while V_c > 200kts), the RA is also no longer used for computation.
// This Failure type is latched (meaning the result of the test is remembered and the ELAC must be reset for
// the RA to be able to be used again).
// The Data validation method depends on the validity through SSM and Coherence monitoring:
// * If both RAs are declared valid, comparison of the two values is performed:
//   If the difference between the two values is above a threshold during a confirmation time,
//   the value used for computation is set above 200ft except if flaps/slats are fully extended for at least 10s,
//   in which case the lower of the two values is used. (Not sure if this behaviour for flaps full is correct)
//   Else the arithmetic mean of the two values is used for computation.
// * If only one RA is declared valid, set the value used for computation to a value above 200ft if V_c is greater
//   than 180kts, else use the value. (not sure if the else condition is correct)
// * If no RA is valid, set the value used for computation to a value above 200ft. (This is so that flight law is kept
//   active normally, since in this case, when the gear is extended, direct law will be activated as the flare law)
void Elac::monitorRa(double deltaTime) {
  bool ra1SsmInvalid = busInputs.ra1.radioHeight.isFw();
  bool ra2SsmInvalid = busInputs.ra2.radioHeight.isFw();
  double ra1Value = busInputs.ra1.radioHeight.value();
  double ra2Value = busInputs.ra2.radioHeight.value();

  if (ra1CoherenceConfirmNode.update(busInputs.ra1.radioHeight.isNo() && busInputs.ra1.radioHeight.value() < 50 && false, deltaTime)) {
    ra1CoherenceRejected = true;
  }
  if (ra2CoherenceConfirmNode.update(busInputs.ra2.radioHeight.isNo() && busInputs.ra2.radioHeight.value() < 50 && false, deltaTime)) {
    ra2CoherenceRejected = true;
  }

  ra1Invalid = ra1SsmInvalid || ra1CoherenceRejected;
  ra2Invalid = ra2SsmInvalid || ra2CoherenceRejected;

  if (!ra1Invalid && !ra2Invalid) {
    if (raDifferenceConfirmNode.update(std::abs(ra1Value - ra2Value) > raMaxDifference, deltaTime)) {
      // TODO implement flaps/slats full condition
      raValueForComputation = std::min(ra1Value, ra2Value);
    } else {
      raValueForComputation = (ra1Value + ra2Value) / 2;
    }
  } else if ((ra1Invalid && !ra2Invalid) || (!ra1Invalid && ra2Invalid)) {
    // TODO implement the 180kts condition
    raValueForComputation = 250;
  } else {
    raValueForComputation = 250;
  }
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
    output.leftSidestickPitchCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.rightSidestickPitchCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.leftSidestickRollCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.rightSidestickRollCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.rudderPedalPosition.setSsm(Arinc429SignStatus::FailureWarning);
    output.aileronCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.rollSpoilerCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.yawDamperCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.discreteStatusWord1.setSsm(Arinc429SignStatus::FailureWarning);
    output.discreteStatusWord2.setSsm(Arinc429SignStatus::FailureWarning);

    return output;
  }

  output.leftSidestickPitchCommand.setFromData(analogInputs.capPitchStickPos, Arinc429SignStatus::NormalOperation);
  output.rightSidestickPitchCommand.setFromData(analogInputs.foPitchStickPos, Arinc429SignStatus::NormalOperation);
  output.leftSidestickRollCommand.setFromData(analogInputs.capRollStickPos, Arinc429SignStatus::NormalOperation);
  output.rightSidestickRollCommand.setFromData(analogInputs.foRollStickPos, Arinc429SignStatus::NormalOperation);
  output.rudderPedalPosition.setFromData(analogInputs.rudderPedalPos, Arinc429SignStatus::NormalOperation);

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
  output.discreteStatusWord2.setBit(17, leftSidestickDisabled);
  output.discreteStatusWord2.setBit(18, rightSidestickDisabled);
  output.discreteStatusWord2.setBit(19, leftSidestickPriorityLocked);
  output.discreteStatusWord2.setBit(20, leftSidestickPriorityLocked);

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
    output.leftElevatorDampingMode = false;
    output.rightElevatorDampingMode = false;
    output.thsActive = false;
  } else {
    output.pitchAxisOk = canEngageInPitch;
    output.leftAileronOk = leftAileronAvail;
    output.rightAileronOk = rightAileronAvail;
    output.ap1Authorised = false;
    output.ap2Authorised = false;
    output.leftAileronActiveMode = (isEngagedInRoll || leftAileronCrossCommandActive) && leftAileronAvail;
    output.rightAileronActiveMode = (isEngagedInRoll || rightAileronCrossCommandActive) && rightAileronAvail;
    output.leftElevatorDampingMode = isEngagedInPitch && leftElevatorAvail;
    output.rightElevatorDampingMode = isEngagedInPitch && rightElevatorAvail;
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
    output.leftElevPosOrder = leftElevPosCommand;
    output.rightElevPosOrder = rightElevPosCommand;
    output.thsPosOrder = thsPosCommand;
    output.leftAileronPosOrder = leftAileronPosCommand;
    output.rightAileronPosOrder = rightAileronPosCommand;
  }

  return output;
}
