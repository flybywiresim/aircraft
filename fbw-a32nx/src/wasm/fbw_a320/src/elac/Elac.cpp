#include "Elac.h"
#include <iostream>

Elac::Elac(bool isUnit1) : isUnit1(isUnit1) {
  elacComputer.initialize();
}

Elac::Elac(const Elac& obj) : isUnit1(obj.isUnit1) {
  elacComputer.initialize();
}

void Elac::clearMemory() {}

// If the power supply is valid, perform the self-test-sequence.
// If at least one hydraulic source is pressurised, perform a short test.
// If no hydraulic supply is pressurised, and the outage was more than 3 seconds (or the switch was turned off),
// perform a long selft-test.
// Else, perform a short self-test.
void Elac::initSelfTests(bool viaPushButton) {
  if (powerSupplyFault)
    return;

  if (modelInputs.in.discrete_inputs.green_low_pressure && modelInputs.in.discrete_inputs.blue_low_pressure &&
      modelInputs.in.discrete_inputs.yellow_low_pressure && (powerSupplyOutageTime > 3 || viaPushButton)) {
    selfTestTimer = longSelfTestDuration;
  } else {
    selfTestTimer = shortSelfTestDuration;
  }
}

// Main update cycle. Surface position through parameters here is temporary.
void Elac::update(double deltaTime, double simulationTime, bool faultActive, bool isPowered) {
  monitorPowerSupply(deltaTime, isPowered);
  monitorButtonStatus();

  updateSelfTest(deltaTime);
  monitorSelf(faultActive);

  elacComputer.setExternalInputs(&modelInputs);
  modelInputs.in.sim_data.computer_running = monitoringHealthy;
  elacComputer.step();
  modelOutputs = elacComputer.getExternalOutputs().out;
}

// Perform self monitoring
void Elac::monitorSelf(bool faultActive) {
  if (faultActive || powerSupplyFault || !selfTestComplete || !modelInputs.in.discrete_inputs.elac_engaged_from_switch) {
    monitoringHealthy = false;
  } else {
    monitoringHealthy = true;
  }
}

// Monitor the overhead button position. If the button was switched off, and is now on,
// begin self-tests.
void Elac::monitorButtonStatus() {
  if (modelInputs.in.discrete_inputs.elac_engaged_from_switch && !prevEngageButtonWasPressed) {
    initSelfTests(true);
  }
  prevEngageButtonWasPressed = modelInputs.in.discrete_inputs.elac_engaged_from_switch;
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
  }
  if (selfTestTimer <= 0) {
    selfTestComplete = true;
  } else {
    selfTestComplete = false;
  }
}

// Write the bus output data and return it.
base_elac_out_bus Elac::getBusOutputs() {
  base_elac_out_bus output = {};

  if (!monitoringHealthy) {
    output.left_aileron_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_aileron_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_elevator_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_elevator_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.ths_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_sidestick_pitch_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_sidestick_pitch_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.left_sidestick_roll_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.right_sidestick_roll_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.rudder_pedal_position_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.aileron_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.roll_spoiler_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.yaw_damper_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.discrete_status_word_1.SSM = Arinc429SignStatus::FailureWarning;
    output.discrete_status_word_2.SSM = Arinc429SignStatus::FailureWarning;

    return output;
  }

  output = modelOutputs.bus_outputs;

  return output;
}

// Write the discrete output data and return it.
base_elac_discrete_outputs Elac::getDiscreteOutputs() {
  base_elac_discrete_outputs output = {};

  output.digital_output_validated = monitoringHealthy;
  if (!monitoringHealthy) {
    output.pitch_axis_ok = false;
    output.left_aileron_ok = false;
    output.right_aileron_ok = false;
    output.ap_1_authorised = false;
    output.ap_2_authorised = false;
    output.left_aileron_active_mode = false;
    output.right_aileron_active_mode = false;
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
base_elac_analog_outputs Elac::getAnalogOutputs() {
  base_elac_analog_outputs output = {};

  if (!monitoringHealthy) {
    output.left_elev_pos_order_deg = 0;
    output.right_elev_pos_order_deg = 0;
    output.ths_pos_order = 0;
    output.left_aileron_pos_order = 0;
    output.right_aileron_pos_order = 0;
  } else {
    output = modelOutputs.analog_outputs;
  }

  return output;
}
