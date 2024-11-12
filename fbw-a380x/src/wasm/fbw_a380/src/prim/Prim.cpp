#include "Prim.h"
#include <iostream>
#include "../Arinc429.h"
#include "../Arinc429Utils.h"

Prim::Prim(bool isUnit1, bool isUnit2, bool isUnit3) : isUnit1(isUnit1), isUnit2(isUnit2), isUnit3(isUnit3) {
  primComputer.initialize();
}

Prim::Prim(const Prim& obj) : isUnit1(obj.isUnit1), isUnit2(obj.isUnit2), isUnit3(obj.isUnit3) {
  primComputer.initialize();
}

void Prim::clearMemory() {}

// If the power supply is valid, perform the self-test-sequence.
// If at least one hydraulic source is pressurised, perform a short test.
// If no hydraulic supply is pressurised, and the outage was more than 3 seconds (or the switch was turned off),
// perform a long selft-test.
// Else, perform a short self-test.
void Prim::initSelfTests(bool viaPushButton) {
  if (powerSupplyFault)
    return;

  if (modelInputs.in.discrete_inputs.green_low_pressure && modelInputs.in.discrete_inputs.yellow_low_pressure &&
      (powerSupplyOutageTime > 3 || viaPushButton)) {
    selfTestTimer = longSelfTestDuration;
  } else {
    selfTestTimer = shortSelfTestDuration;
  }
}

// Main update cycle. Surface position through parameters here is temporary.
void Prim::update(double deltaTime, double simulationTime, bool faultActive, bool isPowered) {
  monitorPowerSupply(deltaTime, isPowered);
  monitorButtonStatus();

  updateSelfTest(deltaTime);
  monitorSelf(faultActive);

  primComputer.setExternalInputs(&modelInputs);
  modelInputs.in.sim_data.computer_running = monitoringHealthy;
  primComputer.step();
  modelOutputs = primComputer.getExternalOutputs().out;
}

// Perform self monitoring
void Prim::monitorSelf(bool faultActive) {
  if (faultActive || powerSupplyFault || !selfTestComplete || !modelInputs.in.discrete_inputs.prim_overhead_button_pressed) {
    monitoringHealthy = false;
  } else {
    monitoringHealthy = true;
  }
}

// Monitor the overhead button position. If the button was switched off, and is now on,
// begin self-tests.
void Prim::monitorButtonStatus() {
  if (modelInputs.in.discrete_inputs.prim_overhead_button_pressed && !prevEngageButtonWasPressed) {
    initSelfTests(true);
  }
  prevEngageButtonWasPressed = modelInputs.in.discrete_inputs.prim_overhead_button_pressed;
}

// Monitor the power supply and record the outage time (used for self test and healthy logic).
// If an outage lasts more than 10ms, stop the program execution.
// If the power has been restored after an outage that lasted longer than 10ms, reset the RAM and
// perform the startup sequence.
void Prim::monitorPowerSupply(double deltaTime, bool isPowered) {
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
void Prim::updateSelfTest(double deltaTime) {
  if (selfTestTimer > 0) {
    selfTestTimer -= deltaTime;
  }
  if (selfTestTimer <= 0) {
    selfTestComplete = true;
  } else {
    selfTestComplete = false;
  }
}

// Write the bus output data and return it.
base_prim_out_bus Prim::getBusOutputs() {
  base_prim_out_bus output = {};

  if (!monitoringHealthy) {
    output.left_inboard_aileron_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_inboard_aileron_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_midboard_aileron_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_midboard_aileron_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_outboard_aileron_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_outboard_aileron_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_spoiler_1_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_spoiler_1_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_spoiler_2_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_spoiler_2_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_spoiler_3_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_spoiler_3_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_spoiler_4_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_spoiler_4_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_spoiler_5_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_spoiler_5_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_spoiler_6_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_spoiler_6_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_spoiler_7_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_spoiler_7_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_spoiler_8_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_spoiler_8_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_inboard_elevator_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_inboard_elevator_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_outboard_elevator_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_outboard_elevator_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.ths_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.upper_rudder_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.lower_rudder_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_sidestick_pitch_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_sidestick_pitch_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_sidestick_roll_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_sidestick_roll_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.rudder_pedal_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.aileron_status_word.SSM = Arinc429SignStatus::FailureWarning;
    output.left_aileron_1_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_aileron_1_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_aileron_2_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_aileron_2_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.spoiler_status_word.SSM = Arinc429SignStatus::FailureWarning;
    output.left_spoiler_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_spoiler_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.elevator_status_word.SSM = Arinc429SignStatus::FailureWarning;
    output.elevator_1_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.elevator_2_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.elevator_3_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.ths_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.rudder_status_word.SSM = Arinc429SignStatus::FailureWarning;
    output.rudder_1_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.rudder_2_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.fctl_law_status_word.SSM = Arinc429SignStatus::FailureWarning;
    output.discrete_status_word_1.SSM = Arinc429SignStatus::FailureWarning;
    output.fe_status_word.SSM = Arinc429SignStatus::FailureWarning;
    output.fg_status_word.SSM = Arinc429SignStatus::FailureWarning;

    return output;
  }

  output = modelOutputs.bus_outputs;

  return output;
}

// Write the discrete output data and return it.
base_prim_discrete_outputs Prim::getDiscreteOutputs() {
  base_prim_discrete_outputs output = {};

  output.prim_healthy = monitoringHealthy;
  if (!monitoringHealthy) {
    output.elevator_1_active_mode = false;
    output.elevator_2_active_mode = false;
    output.elevator_3_active_mode = false;
    output.ths_active_mode = false;
    output.left_aileron_1_active_mode = false;
    output.left_aileron_2_active_mode = false;
    output.right_aileron_1_active_mode = false;
    output.right_aileron_2_active_mode = false;
    output.left_spoiler_electronic_module_enable = false;
    output.right_spoiler_electronic_module_enable = false;
    output.rudder_1_hydraulic_active_mode = false;
    output.rudder_1_electric_active_mode = false;
    output.rudder_2_hydraulic_active_mode = false;
    output.rudder_2_electric_active_mode = false;
  } else {
    output = modelOutputs.discrete_outputs;
  }

  return output;
}

// Write the analog outputs and return it.
base_prim_analog_outputs Prim::getAnalogOutputs() {
  base_prim_analog_outputs output = {};

  if (!monitoringHealthy) {
    output.elevator_1_pos_order_deg = 0;
    output.elevator_2_pos_order_deg = 0;
    output.elevator_3_pos_order_deg = 0;
    output.ths_pos_order_deg = 0;
    output.left_aileron_1_pos_order_deg = 0;
    output.left_aileron_2_pos_order_deg = 0;
    output.right_aileron_1_pos_order_deg = 0;
    output.right_aileron_2_pos_order_deg = 0;
    output.left_spoiler_pos_order_deg = 0;
    output.right_spoiler_pos_order_deg = 0;
    output.rudder_1_pos_order_deg = 0;
    output.rudder_2_pos_order_deg = 0;
  } else {
    output = modelOutputs.analog_outputs;
  }

  return output;
}
