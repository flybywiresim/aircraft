#include "Fcu.h"
#include "../Arinc429Utils.h"

Fcu::Fcu() {
  fcuComputer.initialize();
}

void Fcu::initSelfTests() {
  if (powerSupplyFault)
    return;

  selfTestTimer = selfTestDuration;
}

void Fcu::update(double deltaTime, double simulationTime, bool faultActive, bool isPowered) {
  monitorPowerSupply(deltaTime, isPowered);

  updateSelfTest(deltaTime);
  monitorSelf(faultActive);

  fcuHealthy = monitoringHealthy;
  modelInputs.in.sim_data.computer_running = fcuHealthy;

  fcuComputer.setExternalInputs(&modelInputs);
  fcuComputer.step();
  modelOutputs = fcuComputer.getExternalOutputs().out;
}

void Fcu::monitorSelf(bool faultActive) {
  if (faultActive || powerSupplyFault || !selfTestComplete) {
    monitoringHealthy = false;
  } else {
    monitoringHealthy = true;
  }
}

void Fcu::monitorPowerSupply(double deltaTime, bool isPowered) {
  if (!isPowered || modelInputs.in.discrete_inputs.fcu_switched_off) {
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

void Fcu::updateSelfTest(double deltaTime) {
  if (selfTestTimer > 0) {
    selfTestTimer -= deltaTime;
  }
  if (selfTestTimer <= 0) {
    selfTestComplete = true;
  } else {
    selfTestComplete = false;
  }
}

base_fcu_bus Fcu::getBusOutputs() {
  if (!fcuHealthy) {
    return {};
  }

  return modelOutputs.bus_outputs;
}

base_fcu_discrete_outputs Fcu::getDiscreteOutputs() {
  base_fcu_discrete_outputs output = {};

  output.fcu_healthy = fcuHealthy;
  if (fcuHealthy) {
    output = modelOutputs.discrete_outputs;
  }

  if (modelInputs.in.discrete_inputs.efis_backup_activated) {
    output.efis_outputs = {};
  }

  if (!modelOutputs.discrete_outputs.afs_outputs.afs_cp_active) {
    output.afs_outputs = {};
  }

  return output;
}
