#include "Fmgc.h"
#include "../Arinc429.h"

Fmgc::Fmgc(bool isUnit1) : isUnit1(isUnit1) {
  fmgcComputer.initialize();
}

Fmgc::Fmgc(const Fmgc& obj) : isUnit1(obj.isUnit1) {
  fmgcComputer.initialize();
}

// If the power supply is valid, perform the self-test-sequence.
// If at least one hydraulic source is pressurised, perform a short test.
// If no hydraulic supply is pressurised, and the outage was more than 3 seconds (or the switch was turned off),
// perform a long selft-test.
// Else, perform a short self-test.
void Fmgc::initSelfTests() {
  if (powerSupplyFault)
    return;

  clearMemory();
  selfTestTimer = selfTestDuration;
}

// After the self-test is complete, erase all data in RAM.
void Fmgc::clearMemory() {}

// Main update cycle. Surface position through parameters here is temporary.
void Fmgc::update(double deltaTime, double simulationTime, bool faultActive, bool isPowered) {
  monitorPowerSupply(deltaTime, isPowered);

  updateSelfTest(deltaTime);
  monitorSelf(faultActive);

  modelInputs.in.sim_data.computer_running = monitoringHealthy;
  fmgcComputer.setExternalInputs(&modelInputs);
  fmgcComputer.step();
  modelOutputs = fmgcComputer.getExternalOutputs().out;
}

// Perform self monitoring
void Fmgc::monitorSelf(bool faultActive) {
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
void Fmgc::monitorPowerSupply(double deltaTime, bool isPowered) {
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
void Fmgc::updateSelfTest(double deltaTime) {
  if (selfTestTimer > 0) {
    selfTestTimer -= deltaTime;
  }
  if (selfTestTimer <= 0) {
    selfTestComplete = true;
  } else {
    selfTestComplete = false;
  }
}

// Write the discrete output data and return it.
base_fmgc_discrete_outputs Fmgc::getDiscreteOutputs() {
  base_fmgc_discrete_outputs output = {};

  output.fmgc_healthy = !monitoringHealthy;
  if (!monitoringHealthy) {
    output.athr_own_engaged = false;
    output.fd_own_engaged = false;
    output.ap_own_engaged = false;
    output.fcu_own_fail = false;
    output.ils_test_inhibit = false;
  } else {
    output = modelOutputs.discrete_outputs;
  }

  return output;
}

base_fmgc_bus_outputs Fmgc::getBusOutputs() {
  base_fmgc_bus_outputs output = {};

  if (!monitoringHealthy) {
    return output;
  }

  output = modelOutputs.bus_outputs;

  return output;
}

const fmgc_outputs& Fmgc::getDebugOutputs() const {
  return fmgcComputer.getExternalOutputs().out;
}
