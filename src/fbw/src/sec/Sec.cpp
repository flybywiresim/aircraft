#include "Sec.h"
#include <iostream>

Sec::Sec(bool isUnit1, bool isUnit3) : isUnit1(isUnit1), isUnit3(isUnit3) {
  secComputer.initialize();
}

Sec::Sec(const Sec& obj) : isUnit1(obj.isUnit1), isUnit3(obj.isUnit3) {
  secComputer.initialize();
}

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
void Sec::clearMemory() {}

// Main update cycle. Surface position through parameters here is temporary.
void Sec::update(double deltaTime, double simulationTime, bool faultActive, bool isPowered) {
  monitorPowerSupply(deltaTime, isPowered);

  updateSelfTest(deltaTime);
  monitorSelf(faultActive);

  secComputer.setExternalInputs(&modelInputs);
  secComputer.step();
  modelOutputs = secComputer.getExternalOutputs().out;
}

// Perform self monitoring. If
void Sec::monitorSelf(bool faultActive) {
  cpuStopped = cpuStoppedFlipFlop.update(faultActive || powerSupplyFault, cpuStopped && selfTestComplete && !powerSupplyFault);
  if (cpuStopped) {
    modelInputs.in.sim_data.computer_running = false;
  }

  bool shouldReset = cpuStopped && resetPulseNode.update(modelInputs.in.discrete_inputs.sec_engaged_from_switch) && !powerSupplyFault;
  if (shouldReset) {
    initSelfTests();
  }

  monitoringHealthy = !cpuStopped && !powerSupplyFault && modelInputs.in.discrete_inputs.sec_engaged_from_switch;
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
    }
  }
  if (selfTestTimer <= 0) {
    selfTestComplete = true;
    modelInputs.in.sim_data.computer_running = true;
  } else {
    selfTestComplete = false;
    modelInputs.in.sim_data.computer_running = false;
  }
}

// Write the bus output data and return it.
base_sec_out_bus Sec::getBusOutputs() {
  base_sec_out_bus output = {};

  if (!monitoringHealthy) {
    output.left_spoiler_1_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_spoiler_1_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_spoiler_2_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_spoiler_2_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_elevator_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_elevator_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.ths_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_sidestick_pitch_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_sidestick_pitch_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_sidestick_roll_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_sidestick_roll_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.speed_brake_lever_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.thrust_lever_angle_1_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.thrust_lever_angle_2_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.discrete_status_word_1.SSM = Arinc429SignStatus::FailureWarning;
    output.discrete_status_word_2.SSM = Arinc429SignStatus::FailureWarning;

    return output;
  }

  output = modelOutputs.bus_outputs;

  return output;
}

// Write the discrete output data and return it.
base_sec_discrete_outputs Sec::getDiscreteOutputs() {
  base_sec_discrete_outputs output = {};

  output.sec_failed = !monitoringHealthy;
  if (!monitoringHealthy) {
    output.thr_reverse_selected = false;
    output.left_elevator_ok = false;
    output.right_elevator_ok = false;
    output.ground_spoiler_out = false;
    output.left_elevator_damping_mode = false;
    output.right_elevator_damping_mode = false;
    output.ths_active = false;
    output.batt_power_supply = false;
  } else {
    output = modelOutputs.discrete_outputs;
  }

  return output;
}

// Write the analog outputs and return it.
base_sec_analog_outputs Sec::getAnalogOutputs() {
  base_sec_analog_outputs output = {};

  if (!monitoringHealthy) {
    output.left_elev_pos_order_deg = 0;
    output.right_elev_pos_order_deg = 0;
    output.ths_pos_order_deg = 0;
    output.left_spoiler_1_pos_order_deg = 0;
    output.right_spoiler_1_pos_order_deg = 0;
    output.left_spoiler_2_pos_order_deg = 0;
    output.right_spoiler_2_pos_order_deg = 0;
  } else {
    output = modelOutputs.analog_outputs;
  }

  return output;
}
