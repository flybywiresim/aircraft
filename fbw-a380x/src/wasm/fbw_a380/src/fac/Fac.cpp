#include "Fac.h"

#include "../Arinc429.h"

Fac::Fac(bool isUnit1) : isUnit1(isUnit1) {
  facComputer.initialize();
}

Fac::Fac(const Fac& obj) : isUnit1(obj.isUnit1) {
  facComputer.initialize();
}

// Erase all data in RAM
void Fac::clearMemory() {}

// Main update cycle. Surface position through parameters here is temporary.
void Fac::update(double deltaTime, double simulationTime, bool faultActive, bool isPowered) {
  monitorPowerSupply(deltaTime, isPowered);

  updateSelfTest(deltaTime);
  monitorSelf(faultActive);

  if (!shortPowerFailure) {
    facComputer.setExternalInputs(&modelInputs);
    facComputer.step();
    modelOutputs = facComputer.getExternalOutputs().out;
  }
}

// Software reset logic. After a reset, start self-test if on ground and engines off, and reset RAM.
void Fac::initSelfTests() {
  if (modelInputs.in.discrete_inputs.nose_gear_pressed && modelInputs.in.discrete_inputs.engine_1_stopped &&
      modelInputs.in.discrete_inputs.engine_2_stopped && powerSupplyOutageTime > 4) {
    selfTestTimer = selfTestDuration;
  }
}

// Perform self monitoring. This is implemented as hard-wired circuitry.
// If on ground and a fault or long power failure occurs, reset automatically at power restoration.
// If in flight, a manual reset via the FAC pushbutton has to occure for a reset.
void Fac::monitorSelf(bool faultActive) {
  bool softwareHealthy = !faultActive && selfTestComplete;
  bool softwareResetCondition = !facHealthy && pushbuttonPulse.update(modelInputs.in.discrete_inputs.fac_engaged_from_switch);

  // If the hardware signal is given to reset, then clear the memory.
  if (softwareResetCondition) {
    clearMemory();
  }

  facHealthy = facHealthyFlipFlop.update(softwareHealthy && (softwareResetCondition || modelInputs.in.discrete_inputs.nose_gear_pressed),
                                         longPowerFailure || !softwareHealthy);

  modelInputs.in.sim_data.computer_running = facHealthy;
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

base_fac_bus Fac::getBusOutputs() {
  base_fac_bus output = {};

  if (!facHealthy) {
    output.discrete_word_1.SSM = Arinc429SignStatus::FailureWarning;
    output.discrete_word_2.SSM = Arinc429SignStatus::FailureWarning;
    output.discrete_word_3.SSM = Arinc429SignStatus::FailureWarning;
    output.discrete_word_4.SSM = Arinc429SignStatus::FailureWarning;
    output.discrete_word_5.SSM = Arinc429SignStatus::FailureWarning;
    output.gamma_a_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.gamma_t_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.total_weight_lbs.SSM = Arinc429SignStatus::FailureWarning;
    output.center_of_gravity_pos_percent.SSM = Arinc429SignStatus::FailureWarning;
    output.sideslip_target_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.fac_slat_angle_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.fac_flap_angle_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.rudder_travel_limit_command_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.delta_r_yaw_damper_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.estimated_sideslip_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.v_alpha_lim_kn.SSM = Arinc429SignStatus::FailureWarning;
    output.v_ls_kn.SSM = Arinc429SignStatus::FailureWarning;
    output.v_stall_kn.SSM = Arinc429SignStatus::FailureWarning;
    output.v_alpha_prot_kn.SSM = Arinc429SignStatus::FailureWarning;
    output.v_stall_warn_kn.SSM = Arinc429SignStatus::FailureWarning;
    output.speed_trend_kn.SSM = Arinc429SignStatus::FailureWarning;
    output.v_3_kn.SSM = Arinc429SignStatus::FailureWarning;
    output.v_4_kn.SSM = Arinc429SignStatus::FailureWarning;
    output.v_man_kn.SSM = Arinc429SignStatus::FailureWarning;
    output.v_max_kn.SSM = Arinc429SignStatus::FailureWarning;
    output.v_fe_next_kn.SSM = Arinc429SignStatus::FailureWarning;
    output.delta_r_rudder_trim_deg.SSM = Arinc429SignStatus::FailureWarning;
    output.rudder_trim_pos_deg.SSM = Arinc429SignStatus::FailureWarning;

    return output;
  }

  output = modelOutputs.bus_outputs;

  return output;
}

base_fac_discrete_outputs Fac::getDiscreteOutputs() {
  base_fac_discrete_outputs output = {};

  output.fac_healthy = facHealthy;

  if (!facHealthy) {
    output.yaw_damper_engaged = false;
    output.rudder_trim_engaged = false;
    output.rudder_travel_lim_engaged = false;
    output.yaw_damper_avail_for_norm_law = false;
  } else {
    output = modelOutputs.discrete_outputs;
  }

  return output;
}

base_fac_analog_outputs Fac::getAnalogOutputs() {
  base_fac_analog_outputs output = {};

  if (!facHealthy) {
    output.yaw_damper_order_deg = 0;
    output.rudder_trim_order_deg = 0;
    output.rudder_travel_limit_order_deg = 0;
  } else {
    output = modelOutputs.analog_outputs;
  }

  return output;
}
