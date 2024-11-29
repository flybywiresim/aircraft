#include "Fcu.h"
#include "../Arinc429Utils.h"

Fcu::Fcu() {
  fcuComputer.initialize();
}

void Fcu::initSelfTests(int index) {
  if (powerSupplyFault[index])
    return;

  selfTestTimer[index] = selfTestDuration;
}

void Fcu::update(double deltaTime,
                 double simulationTime,
                 bool fcu1FaultActive,
                 bool fcu2FaultActive,
                 bool fcu1IsPowered,
                 bool fcu2IsPowered) {
  for (int i = 0; i < 2; i++) {
    monitorPowerSupply(deltaTime, i == 0 ? fcu1IsPowered : fcu2IsPowered, i);

    updateSelfTest(deltaTime, i);
    monitorSelf(i == 0 ? fcu1FaultActive : fcu2FaultActive, i);
  }

  fcuHealthy = monitoringHealthy[0] || monitoringHealthy[1];
  modelInputs.in.sim_data.computer_running = fcuHealthy;

  fcuComputer.setExternalInputs(&modelInputs);
  fcuComputer.step();
  modelOutputs = fcuComputer.getExternalOutputs().out;
}

void Fcu::monitorSelf(bool faultActive, int index) {
  if (faultActive || powerSupplyFault[index] || !selfTestComplete[index]) {
    monitoringHealthy[index] = false;
  } else {
    monitoringHealthy[index] = true;
  }
}

void Fcu::monitorPowerSupply(double deltaTime, bool isPowered, int index) {
  if (!isPowered) {
    powerSupplyOutageTime[index] += deltaTime;
  }
  if (powerSupplyOutageTime[index] > minimumPowerOutageTimeForFailure) {
    powerSupplyFault[index] = true;
  }
  if (isPowered && powerSupplyFault[index]) {
    powerSupplyFault[index] = false;
    initSelfTests(index);
    powerSupplyOutageTime[index] = 0;
  }
}

void Fcu::updateSelfTest(double deltaTime, int index) {
  if (selfTestTimer[index] > 0) {
    selfTestTimer[index] -= deltaTime;
  }
  if (selfTestTimer[index] <= 0) {
    selfTestComplete[index] = true;
  } else {
    selfTestComplete[index] = false;
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
  if (!fcuHealthy) {
    return output;
  } else {
    return modelOutputs.discrete_outputs;
  }
}
