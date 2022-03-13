#include "Fac.h"

Fac::Fac(bool isUnit1) : isUnit1(isUnit1) {}

// Erase all data in RAM
void Fac::clearMemory() {
  yawDamperEngaged = false;
  yawDamperHasPriority = false;
  yawDamperCanEngage = false;
  yawDamperServoAvail = false;
  rudderTrimEngaged = false;
  rudderTrimHasPriority = false;
  rudderTrimCanEngage = false;
  rudderTrimServoAvail = false;
  rudderTravelLimEngaged = false;
  rudderTravelLimHasPriority = false;
  rudderTravelLimCanEngage = false;
  rudderTravelLimServoAvail = false;
}

// Main update cycle. Surface position through parameters here is temporary.
void Fac::update(double deltaTime, double simulationTime, bool faultActive, bool isPowered, double surfaceCommands[2]) {
  monitorPowerSupply(deltaTime, isPowered);

  updateSelfTest(deltaTime);
  monitorSelf(faultActive);

  if (!shortPowerFailure) {
    computeComputerEngagementYawDamper();
    computeComputerEngagementRudderTrim();
    computeComputerEngagementRudderTravelLim();
    computeSurfaceSlaving(surfaceCommands);
  }
}

void Fac::computeComputerEngagementYawDamper() {
  // TODO yaw damper servo fault should also make the servo not avail
  yawDamperServoAvail = discreteInputs.yawDamperHasHydPress;

  // TODO Peripheral sensor status (i.e. ADIRS) is not yet included here
  yawDamperCanEngage = yawDamperServoAvail && discreteInputs.facEngagedFromSwitch && facHealthy;

  if (isUnit1) {
    yawDamperHasPriority = true;
  } else {
    yawDamperHasPriority = !discreteInputs.yawDamperOppEngaged;
  }

  yawDamperEngaged = yawDamperCanEngage && yawDamperHasPriority;
}

void Fac::computeComputerEngagementRudderTrim() {
  rudderTrimServoAvail = discreteInputs.rudderTrimActuatorHealthy;

  // TODO Peripheral sensor status (i.e. ADIRS) is not yet included here
  rudderTrimCanEngage = rudderTrimServoAvail && discreteInputs.facEngagedFromSwitch && facHealthy;

  if (isUnit1) {
    rudderTrimHasPriority = true;
  } else {
    rudderTrimHasPriority = !discreteInputs.rudderTrimOppEngaged;
  }

  rudderTrimEngaged = rudderTrimCanEngage && rudderTrimHasPriority;
}

void Fac::computeComputerEngagementRudderTravelLim() {
  rudderTravelLimServoAvail = discreteInputs.rudderTrimActuatorHealthy;

  // TODO Peripheral sensor status (i.e. ADIRS) is not yet included here
  rudderTravelLimCanEngage = rudderTrimServoAvail && discreteInputs.facEngagedFromSwitch && facHealthy;

  if (isUnit1) {
    rudderTravelLimHasPriority = true;
  } else {
    rudderTravelLimHasPriority = !discreteInputs.rudderTrimOppEngaged;
  }

  rudderTravelLimEngaged = rudderTravelLimCanEngage && rudderTravelLimHasPriority;
}

// Compute the various surface slaving commands from the law outputs. (the law outputs come from outside the computer atm)
void Fac::computeSurfaceSlaving(double surfaceCommands[2]) {
  if (yawDamperEngaged) {
    yawDamperPosCommand = surfaceCommands[0] * 30;
  } else {
    yawDamperPosCommand = 0;
  }

  if (rudderTrimEngaged) {
    rudderTrimPosCommand = surfaceCommands[1] * 30;
  } else {
    rudderTrimPosCommand = 0;
  }

  if (rudderTravelLimEngaged) {
    rudderTravelLimPosCommand = 0;
  } else {
    rudderTravelLimPosCommand = 0;
  }
}

// Software reset logic. After a reset, start self-test if on ground and engines off, and reset RAM.
void Fac::initSelfTests() {
  if (discreteInputs.noseGearPressed && discreteInputs.engine1Stopped && discreteInputs.engine2Stopped && powerSupplyOutageTime > 4) {
    selfTestTimer = selfTestDuration;
  }
}

// Perform self monitoring. This is implemented as hard-wired circuitry.
// If on ground and a fault or long power failure occurs, reset automatically at power restoration.
// If in flight, a manual reset via the FAC pushbutton has to occure for a reset.
void Fac::monitorSelf(bool faultActive) {
  bool softwareHealthy = !faultActive && selfTestComplete;
  bool softwareResetCondition = !facHealthy && pushbuttonPulse.update(discreteInputs.facEngagedFromSwitch);

  // If the hardware signal is given to reset, then clear the memory.
  if (softwareResetCondition) {
    clearMemory();
  }

  facHealthy = facHealthyFlipFlop.update(softwareHealthy && (softwareResetCondition || discreteInputs.noseGearPressed),
                                         longPowerFailure || !softwareHealthy);
}

// Monitor the power supply and record the outage time (healthy logic).
// If an outage lasts more than 10ms but less than 200ms, stop the program execution,
// but return to normal operation at power restoration.
// If an outage lasts more than 200ms, stop program execution. In this case, the computer
// memory is lost.
void Fac::monitorPowerSupply(double deltaTime, bool isPowered) {
  if (!isPowered) {
    powerSupplyOutageTime += deltaTime;
  }
  shortPowerFailure = powerSupplyOutageTime > shortPowerFailureTime;
  longPowerFailure = powerSupplyOutageTime > longPowerFailureTime;

  if (isPowered && powerSupplyOutageTime > 0) {
    if (powerSupplyOutageTime > longPowerFailureTime) {
      clearMemory();
    }
    initSelfTests();
    powerSupplyOutageTime = 0;
  }
}

// Update the Self-test-Sequence
void Fac::updateSelfTest(double deltaTime) {
  if (selfTestTimer > 0) {
    selfTestTimer -= deltaTime;
    selfTestComplete = false;
  } else {
    selfTestComplete = true;
  }
}

FacBus Fac::getBusOutputs() {
  FacBus output = {};

  if (!facHealthy) {
    output.discreteWord1.setSsm(Arinc429SignStatus::FailureWarning);
    output.discreteWord2.setSsm(Arinc429SignStatus::FailureWarning);
    output.discreteWord3.setSsm(Arinc429SignStatus::FailureWarning);
    output.discreteWord4.setSsm(Arinc429SignStatus::FailureWarning);
    output.gammaA.setSsm(Arinc429SignStatus::FailureWarning);
    output.gammaT.setSsm(Arinc429SignStatus::FailureWarning);
    output.weight.setSsm(Arinc429SignStatus::FailureWarning);
    output.centerOfGravity.setSsm(Arinc429SignStatus::FailureWarning);
    output.sideslipTarget.setSsm(Arinc429SignStatus::FailureWarning);
    output.facSlatAngle.setSsm(Arinc429SignStatus::FailureWarning);
    output.facFlapAngle.setSsm(Arinc429SignStatus::FailureWarning);
    output.rudderTravelLimitCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.deltaRYawDamperVoted.setSsm(Arinc429SignStatus::FailureWarning);
    output.estimatedSideslip.setSsm(Arinc429SignStatus::FailureWarning);
    output.vAlphaLim.setSsm(Arinc429SignStatus::FailureWarning);
    output.vLs.setSsm(Arinc429SignStatus::FailureWarning);
    output.vStall.setSsm(Arinc429SignStatus::FailureWarning);
    output.vAlphaProt.setSsm(Arinc429SignStatus::FailureWarning);
    output.vStallWarn.setSsm(Arinc429SignStatus::FailureWarning);
    output.speedTrend.setSsm(Arinc429SignStatus::FailureWarning);
    output.v3.setSsm(Arinc429SignStatus::FailureWarning);
    output.v4.setSsm(Arinc429SignStatus::FailureWarning);
    output.vMan.setSsm(Arinc429SignStatus::FailureWarning);
    output.vMax.setSsm(Arinc429SignStatus::FailureWarning);
    output.vFeNext.setSsm(Arinc429SignStatus::FailureWarning);
    output.deltaRRudderTrim.setSsm(Arinc429SignStatus::FailureWarning);
    output.rudderTrimPos.setSsm(Arinc429SignStatus::FailureWarning);

    return output;
  }

  output.discreteWord1.setSsm(Arinc429SignStatus::NormalOperation);
  output.discreteWord1.setBit(11, false);
  output.discreteWord1.setBit(12, false);
  output.discreteWord1.setBit(13, false);
  output.discreteWord1.setBit(14, false);
  output.discreteWord1.setBit(15, false);
  output.discreteWord1.setBit(16, false);
  output.discreteWord1.setBit(17, false);
  output.discreteWord1.setBit(18, false);
  output.discreteWord1.setBit(19, false);
  output.discreteWord1.setBit(20, false);
  output.discreteWord1.setBit(21, false);
  output.discreteWord1.setBit(22, false);
  output.discreteWord1.setBit(23, false);
  output.discreteWord1.setBit(24, false);
  output.discreteWord1.setBit(25, false);
  output.discreteWord1.setBit(26, false);
  output.discreteWord1.setBit(27, false);
  output.discreteWord1.setBit(28, false);
  output.discreteWord1.setBit(29, false);

  output.discreteWord2.setSsm(Arinc429SignStatus::NormalOperation);
  output.discreteWord2.setBit(11, yawDamperEngaged);
  output.discreteWord2.setBit(12, discreteInputs.yawDamperOppEngaged);
  output.discreteWord2.setBit(13, rudderTrimEngaged);
  output.discreteWord2.setBit(14, discreteInputs.rudderTrimOppEngaged);
  output.discreteWord2.setBit(15, rudderTravelLimEngaged);
  output.discreteWord2.setBit(16, discreteInputs.rudderTravelLimOppEngaged);
  output.discreteWord2.setBit(17, false);
  output.discreteWord2.setBit(18, false);
  output.discreteWord2.setBit(19, false);
  output.discreteWord2.setBit(20, false);
  output.discreteWord2.setBit(21, false);
  output.discreteWord2.setBit(22, false);
  output.discreteWord2.setBit(23, false);
  output.discreteWord2.setBit(24, false);
  output.discreteWord2.setBit(25, false);
  output.discreteWord2.setBit(26, false);
  output.discreteWord2.setBit(27, false);
  output.discreteWord2.setBit(28, false);
  output.discreteWord2.setBit(29, false);

  output.discreteWord3.setSsm(Arinc429SignStatus::NormalOperation);
  output.discreteWord3.setBit(11, false);
  output.discreteWord3.setBit(12, false);
  output.discreteWord3.setBit(13, false);
  output.discreteWord3.setBit(14, false);
  output.discreteWord3.setBit(15, false);
  output.discreteWord3.setBit(16, false);
  output.discreteWord3.setBit(17, false);
  output.discreteWord3.setBit(18, false);
  output.discreteWord3.setBit(19, false);
  output.discreteWord3.setBit(20, false);
  output.discreteWord3.setBit(21, false);
  output.discreteWord3.setBit(22, false);
  output.discreteWord3.setBit(23, false);
  output.discreteWord3.setBit(24, false);
  output.discreteWord3.setBit(25, false);
  output.discreteWord3.setBit(26, false);
  output.discreteWord3.setBit(27, false);
  output.discreteWord3.setBit(28, false);
  output.discreteWord3.setBit(29, false);

  output.discreteWord4.setSsm(Arinc429SignStatus::NormalOperation);
  output.discreteWord4.setBit(11, false);
  output.discreteWord4.setBit(12, false);
  output.discreteWord4.setBit(13, false);
  output.discreteWord4.setBit(14, false);
  output.discreteWord4.setBit(15, false);
  output.discreteWord4.setBit(16, false);
  output.discreteWord4.setBit(17, false);
  output.discreteWord4.setBit(18, false);
  output.discreteWord4.setBit(19, false);
  output.discreteWord4.setBit(20, false);
  output.discreteWord4.setBit(21, false);
  output.discreteWord4.setBit(22, false);
  output.discreteWord4.setBit(23, false);
  output.discreteWord4.setBit(24, false);
  output.discreteWord4.setBit(25, false);
  output.discreteWord4.setBit(26, false);
  output.discreteWord4.setBit(27, false);
  output.discreteWord4.setBit(28, false);
  output.discreteWord4.setBit(29, false);

  output.discreteWord5.setSsm(Arinc429SignStatus::NormalOperation);
  output.discreteWord5.setBit(11, false);
  output.discreteWord5.setBit(12, false);
  output.discreteWord5.setBit(13, false);
  output.discreteWord5.setBit(14, false);
  output.discreteWord5.setBit(15, false);
  output.discreteWord5.setBit(16, false);
  output.discreteWord5.setBit(17, false);
  output.discreteWord5.setBit(18, false);
  output.discreteWord5.setBit(19, false);
  output.discreteWord5.setBit(20, false);
  output.discreteWord5.setBit(21, false);
  output.discreteWord5.setBit(22, false);
  output.discreteWord5.setBit(23, yawDamperServoAvail);
  output.discreteWord5.setBit(24, rudderTrimServoAvail);
  output.discreteWord5.setBit(25, rudderTravelLimServoAvail);
  output.discreteWord5.setBit(26, false);
  output.discreteWord5.setBit(27, false);
  output.discreteWord5.setBit(28, false);
  output.discreteWord5.setBit(29, false);

  output.gammaA.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.gammaT.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.weight.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.centerOfGravity.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.sideslipTarget.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.facSlatAngle.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.facFlapAngle.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.rudderTravelLimitCommand.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.deltaRYawDamperVoted.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.estimatedSideslip.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.vAlphaLim.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.vLs.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.vStall.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.vAlphaProt.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.vStallWarn.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.speedTrend.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.v3.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.v4.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.vMan.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.vMax.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.vFeNext.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.deltaRRudderTrim.setFromData(0, Arinc429SignStatus::NormalOperation);
  output.rudderTrimPos.setFromData(0, Arinc429SignStatus::NormalOperation);

  return output;
}

FacDiscreteOutputs Fac::getDiscreteOutputs() {
  FacDiscreteOutputs output = {};

  output.facHealthy = facHealthy;

  if (!facHealthy) {
    output.yawDamperEngaged = false;
    output.rudderTrimEngaged = false;
    output.rudderTravelLimEngaged = false;
    output.yawDamperNormalLawAvail = false;
  } else {
    output.yawDamperEngaged = yawDamperEngaged;
    output.rudderTrimEngaged = rudderTrimEngaged;
    output.rudderTravelLimEngaged = rudderTravelLimEngaged;
    output.yawDamperNormalLawAvail = yawDamperCanEngage;
  }

  return output;
}

FacAnalogOutputs Fac::getAnalogOutputs() {
  FacAnalogOutputs output = {};

  if (!facHealthy) {
    output.yawDamperOrder = 0;
    output.rudderTrimOrder = 0;
    output.rudderTravelLimOrder = 0;
  } else {
    output.yawDamperOrder = yawDamperPosCommand;
    output.rudderTrimOrder = rudderTrimPosCommand;
    output.rudderTravelLimOrder = rudderTravelLimPosCommand;
  }

  return output;
}
