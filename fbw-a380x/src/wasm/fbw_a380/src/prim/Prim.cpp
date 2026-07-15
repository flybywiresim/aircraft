#include "Prim.h"
#include <iostream>
#include "../Arinc429.h"
#include "../Arinc429Utils.h"

Prim::Prim(bool isUnit1, bool isUnit2, bool isUnit3) : isUnit1(isUnit1), isUnit2(isUnit2), isUnit3(isUnit3) {
  primGeneralLogic.initialize();
  primFctl.initialize();
}

Prim::Prim(const Prim& obj) : isUnit1(obj.isUnit1), isUnit2(obj.isUnit2), isUnit3(obj.isUnit3) {
  primGeneralLogic.initialize();
  primFctl.initialize();
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

  if (primGeneralLogic.A380PrimComputerGeneralLogic_U.in.discrete_inputs.green_low_pressure &&
      primGeneralLogic.A380PrimComputerGeneralLogic_U.in.discrete_inputs.yellow_low_pressure &&
      (powerSupplyOutageTime > 3 || viaPushButton)) {
    selfTestTimer = longSelfTestDuration;
  } else {
    selfTestTimer = shortSelfTestDuration;
  }
}

// Main update cycle. Surface position through parameters here is temporary.
void Prim::update(double deltaTime,
                  double simulationTime,
                  bool faultActive,
                  bool isPowered,
                  SimConnectInterface& simConnectInterface,
                  bool generalLogicDisabled,
                  bool fctlDisabled,
                  bool feDisabled) {
  monitorPowerSupply(deltaTime, isPowered);
  monitorButtonStatus();

  updateSelfTest(deltaTime);
  monitorSelf(faultActive);

  if (generalLogicDisabled || fctlDisabled || feDisabled) {
    simConnectInterface.setClientDataPrimDiscretes(primGeneralLogic.A380PrimComputerGeneralLogic_U.in.discrete_inputs);
    simConnectInterface.setClientDataPrimAnalog(primGeneralLogic.A380PrimComputerGeneralLogic_U.in.analog_inputs);
    simConnectInterface.setClientDataPrimTemporaryAp(primGeneralLogic.A380PrimComputerGeneralLogic_U.in.temporary_ap_input);
  }

  primGeneralLogic.A380PrimComputerGeneralLogic_U.in.sim_data.computer_running = monitoringHealthy;

  // --------------- General Logic Step -----------------

  if (!generalLogicDisabled) {
    primGeneralLogic.step();
  } else {
    primGeneralLogic.A380PrimComputerGeneralLogic_Y = {};
    primGeneralLogic.A380PrimComputerGeneralLogic_Y.out.data = primGeneralLogic.A380PrimComputerGeneralLogic_U.in;
    primGeneralLogic.A380PrimComputerGeneralLogic_Y.out.general_logic = simConnectInterface.getClientDataPrimGeneralLogicOutput();
  }
  primFe.A380PrimComputerFe_U.in = primGeneralLogic.A380PrimComputerGeneralLogic_Y.out;

  if (fctlDisabled || feDisabled) {
    simConnectInterface.setClientDataPrimGeneralLogicOutput(primGeneralLogic.A380PrimComputerGeneralLogic_Y.out.general_logic);
  }

  // --------------- FE Step -----------------

  // Add loopback input (one cycle delay) from F/CTL logic
  if (!fctlDisabled) {
    primFe.A380PrimComputerFe_U.in.fctl_logic = primFctl.A380PrimComputerFctl_Y.out.fctl_logic;
  } else {
    primFe.A380PrimComputerFe_U.in.fctl_logic = simConnectInterface.getClientDataPrimFctlLogicOutput();
  }

  if (!feDisabled) {
    primFe.step();
  } else {
    primFe.A380PrimComputerFe_Y.out = primGeneralLogic.A380PrimComputerGeneralLogic_Y.out;
    primFe.A380PrimComputerFe_Y.out.flight_envelope = simConnectInterface.getClientDataPrimFlightEnvelopeOutput();
  }
  primFctl.A380PrimComputerFctl_U.in = primFe.A380PrimComputerFe_Y.out;

  if (fctlDisabled) {
    simConnectInterface.setClientDataPrimFlightEnvelopeOutput(primGeneralLogic.A380PrimComputerGeneralLogic_Y.out.flight_envelope);
  }

  // --------------- FCTL Step -----------------

  if (!fctlDisabled) {
    primFctl.step();
  } else {
    primFctl.A380PrimComputerFctl_Y.out.discrete_outputs = simConnectInterface.getClientDataPrimDiscretesOutput();
    primFctl.A380PrimComputerFctl_Y.out.analog_outputs = simConnectInterface.getClientDataPrimAnalogsOutput();
    primFctl.A380PrimComputerFctl_Y.out.bus_outputs = simConnectInterface.getClientDataPrimBusOutput();
  }

  // Set client data loopback if any other model is disabled
  if (feDisabled) {
    simConnectInterface.setClientDataPrimFctlLogicOutput(primFctl.A380PrimComputerFctl_Y.out.fctl_logic);
  }
}

A380PrimComputerGeneralLogic::ExternalInputs_A380PrimComputerGeneralLogic_T& Prim::externalInputs() {
  return primGeneralLogic.A380PrimComputerGeneralLogic_U;
}

// Perform self monitoring
void Prim::monitorSelf(bool faultActive) {
  if (faultActive || powerSupplyFault || !selfTestComplete ||
      !primGeneralLogic.A380PrimComputerGeneralLogic_U.in.discrete_inputs.prim_overhead_button_pressed) {
    monitoringHealthy = false;
  } else {
    monitoringHealthy = true;
  }
}

// Monitor the overhead button position. If the button was switched off, and is now on,
// begin self-tests.
void Prim::monitorButtonStatus() {
  if (primGeneralLogic.A380PrimComputerGeneralLogic_U.in.discrete_inputs.prim_overhead_button_pressed && !prevEngageButtonWasPressed) {
    initSelfTests(true);
  }
  prevEngageButtonWasPressed = primGeneralLogic.A380PrimComputerGeneralLogic_U.in.discrete_inputs.prim_overhead_button_pressed;
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
    selfTestFaultLightVisible = false;
  } else {
    selfTestComplete = false;

    // Hardcoded test light sequence. Between the times (in seconds) in each array, the light is on.
    selfTestFaultLightVisible = false;
    double constexpr testLightOnTimes[][2] = {{0, 12.29}, {13.42, 28.67}, {31.04, 31.63}, {31.71, 33.13}, {33.21, 35.75}};
    for (auto& timeRange : testLightOnTimes) {
      double selfTestTimerFromStart = longSelfTestDuration - selfTestTimer;
      if (selfTestTimerFromStart >= timeRange[0] && selfTestTimerFromStart <= timeRange[1]) {
        selfTestFaultLightVisible = true;
        break;
      }
    }
  }
}

// Write the bus output data and return it.
base_prim_out_bus Prim::getBusOutputs() {
  base_prim_out_bus output = {};

  if (!monitoringHealthy) {
    return output;
  }

  const auto& modelOutputs = primFctl.A380PrimComputerFctl_Y.out;
  output = modelOutputs.bus_outputs;

  return output;
}

// Write the discrete output data and return it.
base_prim_discrete_outputs Prim::getDiscreteOutputs() {
  base_prim_discrete_outputs output = {};
  const auto& modelOutputs = primFctl.A380PrimComputerFctl_Y.out;

  output.prim_healthy = (selfTestComplete && monitoringHealthy) || (!selfTestComplete && !selfTestFaultLightVisible);
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
  const auto& modelOutputs = primFctl.A380PrimComputerFctl_Y.out;

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
