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

// Main update cycle
void Fac::update(double deltaTime, double simulationTime, bool faultActive, bool isPowered) {
  monitorPowerSupply(deltaTime, isPowered);

  updateSelfTest(deltaTime);
  monitorSelf(faultActive);

  if (!shortPowerFailure) {
    computeComputerEngagementYawDamper();
    computeComputerEngagementRudderTrim();
    computeComputerEngagementRudderTravelLim();
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
    output.yawDamperOrder = 0;
    output.rudderTrimOrder = 0;
    output.rudderTravelLimOrder = 0;
  }

  return output;
}
