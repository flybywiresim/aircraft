#include "Fmgc.h"
#include "../Arinc429.h"

Fmgc::Fmgc(bool isUnit1) : isUnit1(isUnit1) {
  fmgcComputer.initialize();
}

Fmgc::Fmgc(const Fmgc& obj) : isUnit1(obj.isUnit1) {
  fmgcComputer.initialize();
}

// If the power supply is valid and we are on the ground, perform the self-test-sequence.
// Else, skip the self-test.
void Fmgc::initSelfTests() {
  if (powerSupplyFault)
    return;

  clearMemory();
  if (modelInputs.in.discrete_inputs.nose_gear_pressed_opp && modelInputs.in.discrete_inputs.nose_gear_pressed_own) {
    selfTestTimer = selfTestDuration;
  }
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
    selfTestApEngagedDiscreteOn = false;
  } else {
    selfTestComplete = false;

    // Hardcoded test light sequence. Between the times (in seconds) in each array, the light is on.
    selfTestApEngagedDiscreteOn = false;
    // FIXME no references available, best guess
    double constexpr testApDiscreteOnTimes[][2] = {{24.7, 25.18}, {25.23, 25.35}, {25.46, 25.55}, {25.62, 25.75}, {25.8, 25.95}};
    for (auto& timeRange : testApDiscreteOnTimes) {
      double selfTestTimerFromStart = selfTestDuration - selfTestTimer;
      if (selfTestTimerFromStart >= timeRange[0] && selfTestTimerFromStart <= timeRange[1]) {
        selfTestApEngagedDiscreteOn = true;
        break;
      }
    }
    selfTestAthrEngagedDiscreteOn = false;
    // FIXME no references available, best guess
    double constexpr testAthrDiscreteOnTimes[][2] = {{26.16, 26.6}, {26.7, 26.85}, {26.96, 27.05}, {27.11, 27.22}, {27.32, 27.72}};
    for (auto& timeRange : testAthrDiscreteOnTimes) {
      double selfTestTimerFromStart = selfTestDuration - selfTestTimer;
      if (selfTestTimerFromStart >= timeRange[0] && selfTestTimerFromStart <= timeRange[1]) {
        selfTestAthrEngagedDiscreteOn = true;
        break;
      }
    }
    selfTestDigitalOutValid = false;
    // FIXME no references available, best guess
    double constexpr testDigitalOutValidTimes[][2] = {{25.23, 28.2}, {29.35, 29.75}};
    for (auto& timeRange : testDigitalOutValidTimes) {
      double selfTestTimerFromStart = selfTestDuration - selfTestTimer;
      if (selfTestTimerFromStart >= timeRange[0] && selfTestTimerFromStart <= timeRange[1]) {
        selfTestDigitalOutValid = true;
        break;
      }
    }
  }
}

// Write the discrete output data and return it.
base_fmgc_discrete_outputs Fmgc::getDiscreteOutputs() {
  base_fmgc_discrete_outputs output = {};

  output.fmgc_healthy = monitoringHealthy;

  if (!monitoringHealthy) {
    output.athr_own_engaged = !selfTestComplete && selfTestAthrEngagedDiscreteOn;
    output.fd_own_engaged = false;
    output.ap_own_engaged = !selfTestComplete && selfTestApEngagedDiscreteOn;
    output.fcu_own_fail = false;
    output.ils_test_inhibit = false;
    output.stick_rudder_lock = false;
  } else {
    output = modelOutputs.discrete_outputs;
  }

  return output;
}

base_fmgc_bus_outputs Fmgc::getBusOutputs() {
  base_fmgc_bus_outputs output = {};

  if (!monitoringHealthy) {
    output.fmgc_a_bus.discrete_word_5.SSM = selfTestDigitalOutValid ? Arinc429SignStatus::FunctionalTest : FailureWarning;
    return output;
  }

  output = modelOutputs.bus_outputs;

  return output;
}

const fmgc_outputs& Fmgc::getDebugOutputs() const {
  return fmgcComputer.getExternalOutputs().out;
}
