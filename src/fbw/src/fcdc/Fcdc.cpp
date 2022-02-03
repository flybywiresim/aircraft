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
    updateSidestickPriorityLightLogic();
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

// Compute the logic for the Side Stick priority lights
void Fcdc::updateSidestickPriorityLightLogic() {}

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
    output.rudderPosition.setSsm(Arinc429SignStatus::FailureWarning);
    output.captPitchCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.foPitchCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.aileronLeftPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.elevatorLeftPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.aileronRightPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.elevatorRightPos.setSsm(Arinc429SignStatus::FailureWarning);
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
  } else {
    output.efcsStatus1.setSsm(Arinc429SignStatus::NormalOperation);
    output.efcsStatus1.setBit(11, false);
    output.efcsStatus1.setBit(12, false);
    output.efcsStatus1.setBit(13, false);
    output.efcsStatus1.setBit(15, false);
    output.efcsStatus1.setBit(16, false);
    output.efcsStatus1.setBit(17, false);
    output.efcsStatus1.setBit(18, false);
    output.efcsStatus1.setBit(19, false);
    output.efcsStatus1.setBit(20, false);
    output.efcsStatus1.setBit(21, false);
    output.efcsStatus1.setBit(22, false);
    output.efcsStatus1.setBit(23, !discreteInputs.elac1Valid);
    output.efcsStatus1.setBit(24, !discreteInputs.elac2Valid);
    output.efcsStatus1.setBit(25, !discreteInputs.sec1Valid);
    output.efcsStatus1.setBit(26, !discreteInputs.sec2Valid);
    output.efcsStatus1.setBit(27, false);
    output.efcsStatus1.setBit(28, discreteInputs.oppFcdcFailed);
    output.efcsStatus1.setBit(29, !discreteInputs.sec3Valid);

    output.efcsStatus2.setSsm(Arinc429SignStatus::NormalOperation);
    output.efcsStatus2.setBit(11, false);
    output.efcsStatus2.setBit(12, false);
    output.efcsStatus2.setBit(13, false);
    output.efcsStatus2.setBit(15, false);
    output.efcsStatus2.setBit(16, false);
    output.efcsStatus2.setBit(17, false);
    output.efcsStatus2.setBit(18, false);
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
    output.efcsStatus3.setBit(11, false);
    output.efcsStatus3.setBit(12, false);
    output.efcsStatus3.setBit(13, false);
    output.efcsStatus3.setBit(15, false);
    output.efcsStatus3.setBit(16, false);
    output.efcsStatus3.setBit(17, false);
    output.efcsStatus3.setBit(18, false);
    output.efcsStatus3.setBit(19, discreteInputs.elac1Off);
    output.efcsStatus3.setBit(20, discreteInputs.elac2Off);
    output.efcsStatus3.setBit(21, false);
    output.efcsStatus3.setBit(22, false);
    output.efcsStatus3.setBit(23, false);
    output.efcsStatus3.setBit(24, false);
    output.efcsStatus3.setBit(25, false);
    output.efcsStatus3.setBit(26, false);
    output.efcsStatus3.setBit(27, discreteInputs.sec1Off);
    output.efcsStatus3.setBit(28, discreteInputs.sec2Off);
    output.efcsStatus3.setBit(29, discreteInputs.sec3Off);

    output.efcsStatus4.setSsm(Arinc429SignStatus::NormalOperation);
    output.efcsStatus4.setBit(11, false);
    output.efcsStatus4.setBit(12, false);
    output.efcsStatus4.setBit(13, false);
    output.efcsStatus4.setBit(15, false);
    output.efcsStatus4.setBit(16, false);
    output.efcsStatus4.setBit(17, false);
    output.efcsStatus4.setBit(18, false);
    output.efcsStatus4.setBit(19, false);
    output.efcsStatus4.setBit(20, false);
    output.efcsStatus4.setBit(21, false);
    output.efcsStatus4.setBit(22, false);
    output.efcsStatus4.setBit(23, false);
    output.efcsStatus4.setBit(24, false);
    output.efcsStatus4.setBit(25, false);
    output.efcsStatus4.setBit(26, false);
    output.efcsStatus4.setBit(27, false);
    output.efcsStatus4.setBit(28, false);
    output.efcsStatus4.setBit(29, false);

    output.efcsStatus5.setSsm(Arinc429SignStatus::NormalOperation);
    output.efcsStatus5.setBit(11, false);
    output.efcsStatus5.setBit(12, false);
    output.efcsStatus5.setBit(13, false);
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

    output.captRollCommand.setSsm(Arinc429SignStatus::NoComputedData);
    output.foRollCommand.setSsm(Arinc429SignStatus::NoComputedData);
    output.rudderPosition.setSsm(Arinc429SignStatus::NoComputedData);
    output.captPitchCommand.setSsm(Arinc429SignStatus::NoComputedData);
    output.foPitchCommand.setSsm(Arinc429SignStatus::NoComputedData);
    output.aileronLeftPos.setSsm(Arinc429SignStatus::NoComputedData);
    output.elevatorLeftPos.setSsm(Arinc429SignStatus::NoComputedData);
    output.aileronRightPos.setSsm(Arinc429SignStatus::NoComputedData);
    output.elevatorRightPos.setSsm(Arinc429SignStatus::NoComputedData);
    output.spoilerLeft1Pos.setSsm(Arinc429SignStatus::NoComputedData);
    output.spoilerLeft2Pos.setSsm(Arinc429SignStatus::NoComputedData);
    output.spoilerLeft3Pos.setSsm(Arinc429SignStatus::NoComputedData);
    output.spoilerLeft4Pos.setSsm(Arinc429SignStatus::NoComputedData);
    output.spoilerLeft5Pos.setSsm(Arinc429SignStatus::NoComputedData);
    output.spoilerRight1Pos.setSsm(Arinc429SignStatus::NoComputedData);
    output.spoilerRight2Pos.setSsm(Arinc429SignStatus::NoComputedData);
    output.spoilerRight3Pos.setSsm(Arinc429SignStatus::NoComputedData);
    output.spoilerRight4Pos.setSsm(Arinc429SignStatus::NoComputedData);
    output.spoilerRight5Pos.setSsm(Arinc429SignStatus::NoComputedData);
  }

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
