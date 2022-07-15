#include "Fcdc.h"
#include <iostream>
#include "../Arinc429Utils.h"

using namespace Arinc429Utils;

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
    computeComputerEngagements();
    computeActiveSystemLaws();
    consolidatePositionData();
    computeSidestickPriorityLights(deltaTime);
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

LateralLaw Fcdc::getLateralLawStatusFromBits(bool bit1, bool bit2, bool bit3) {
  if (bit1) {
    return LateralLaw::NormalLaw;
  } else if (bit2) {
    return LateralLaw::DirectLaw;
  } else {
    return LateralLaw::None;
  }
}

PitchLaw Fcdc::getPitchLawStatusFromBits(bool bit1, bool bit2, bool bit3) {
  if (bit1 && !bit2 && !bit3) {
    return PitchLaw::NormalLaw;
  } else if (!bit1 && bit2 && !bit3) {
    return PitchLaw::AlternateLaw1;
  } else if (bit1 && bit2 && !bit3) {
    return PitchLaw::AlternateLaw2;
  } else if (!bit1 && !bit2 && bit3) {
    return PitchLaw::DirectLaw;
  } else {
    return PitchLaw::None;
  }
}

void Fcdc::computeComputerEngagements() {
  elac1EngagedInRoll = bitFromValueOr(busInputs.elac1.discrete_status_word_1, 20, false);
  elac2EngagedInRoll = bitFromValueOr(busInputs.elac2.discrete_status_word_1, 20, false);
  sec1EngagedInRoll = bitFromValueOr(busInputs.sec1.discrete_status_word_1, 22, false);
  sec2EngagedInRoll = bitFromValueOr(busInputs.sec2.discrete_status_word_1, 22, false);
  sec3EngagedInRoll = bitFromValueOr(busInputs.sec3.discrete_status_word_1, 22, false);

  elac1EngagedInPitch = bitFromValueOr(busInputs.elac1.discrete_status_word_1, 19, false);
  elac2EngagedInPitch = bitFromValueOr(busInputs.elac2.discrete_status_word_1, 19, false);
  sec1EngagedInPitch = bitFromValueOr(busInputs.sec1.discrete_status_word_1, 23, false);
  sec2EngagedInPitch = bitFromValueOr(busInputs.sec2.discrete_status_word_1, 23, false);
}

void Fcdc::consolidatePositionData() {
  // Compute Aileron Data. Look at each side individually: if the data from the ELAC that is
  // engaged in roll is valid, use that data. If not, take the data from the other ELAC.
  // If neither are valid, set the respective aileron position as invalid.
  leftAileronPosValid = true;
  if (elac1EngagedInRoll && isNo(busInputs.elac1.left_aileron_position_deg)) {
    leftAileronPos = busInputs.elac1.left_aileron_position_deg.Data;
  } else if (elac2EngagedInRoll && isNo(busInputs.elac2.left_aileron_position_deg)) {
    leftAileronPos = busInputs.elac2.left_aileron_position_deg.Data;
  } else if (isNo(busInputs.elac1.left_aileron_position_deg)) {
    leftAileronPos = busInputs.elac1.left_aileron_position_deg.Data;
  } else if (isNo(busInputs.elac2.left_aileron_position_deg)) {
    leftAileronPos = busInputs.elac2.left_aileron_position_deg.Data;
  } else {
    leftAileronPos = 0;
    leftAileronPosValid = false;
  }

  rightAileronPosValid = true;
  if (elac1EngagedInRoll && isNo(busInputs.elac1.right_aileron_position_deg)) {
    rightAileronPos = busInputs.elac1.right_aileron_position_deg.Data;
  } else if (elac2EngagedInRoll && isNo(busInputs.elac2.right_aileron_position_deg)) {
    rightAileronPos = busInputs.elac2.right_aileron_position_deg.Data;
  } else if (isNo(busInputs.elac1.right_aileron_position_deg)) {
    rightAileronPos = busInputs.elac1.right_aileron_position_deg.Data;
  } else if (isNo(busInputs.elac2.right_aileron_position_deg)) {
    rightAileronPos = busInputs.elac2.right_aileron_position_deg.Data;
  } else {
    rightAileronPos = 0;
    rightAileronPosValid = false;
  }

  // Compute the sidestick positions in roll. Always take the sidestick data
  // from the ELAC that is engaged in roll axis. If no ELAC is engaged in roll,
  // then all the SECs are engaged seperately in the roll axis. In that case, simply
  // choose the first one that has valid stick positions.
  // If no computer is engaged in roll, choose the first computer that outputs valid stick positions.
  // If no computer output valid stick positions, set them as invalid.
  if (elac1EngagedInRoll) {
    rollSidestickPosCapt = busInputs.elac1.left_sidestick_roll_command_deg.Data;
    rollSidestickPosCaptValid = isNo(busInputs.elac1.left_sidestick_roll_command_deg);
    rollSidestickPosFo = busInputs.elac1.right_sidestick_roll_command_deg.Data;
    rollSidestickPosFoValid = isNo(busInputs.elac1.right_sidestick_roll_command_deg);
  } else if (elac2EngagedInRoll) {
    rollSidestickPosCapt = busInputs.elac2.left_sidestick_roll_command_deg.Data;
    rollSidestickPosCaptValid = isNo(busInputs.elac2.left_sidestick_roll_command_deg);
    rollSidestickPosFo = busInputs.elac2.right_sidestick_roll_command_deg.Data;
    rollSidestickPosFoValid = isNo(busInputs.elac2.right_sidestick_roll_command_deg);
  } else if (sec1EngagedInRoll &&
             (isNo(busInputs.sec1.left_sidestick_roll_command_deg) || isNo(busInputs.sec1.right_sidestick_roll_command_deg))) {
    rollSidestickPosCapt = busInputs.sec1.left_sidestick_roll_command_deg.Data;
    rollSidestickPosCaptValid = isNo(busInputs.sec1.left_sidestick_roll_command_deg);
    rollSidestickPosFo = busInputs.sec1.right_sidestick_roll_command_deg.Data;
    rollSidestickPosFoValid = isNo(busInputs.sec1.right_sidestick_roll_command_deg);
  } else if (sec2EngagedInRoll &&
             (isNo(busInputs.sec2.left_sidestick_roll_command_deg) || isNo(busInputs.sec2.right_sidestick_roll_command_deg))) {
    rollSidestickPosCapt = busInputs.sec2.left_sidestick_roll_command_deg.Data;
    rollSidestickPosCaptValid = isNo(busInputs.sec2.left_sidestick_roll_command_deg);
    rollSidestickPosFo = busInputs.sec2.right_sidestick_roll_command_deg.Data;
    rollSidestickPosFoValid = isNo(busInputs.sec2.right_sidestick_roll_command_deg);
  } else if (sec3EngagedInRoll &&
             (isNo(busInputs.sec3.left_sidestick_roll_command_deg) || isNo(busInputs.sec3.right_sidestick_roll_command_deg))) {
    rollSidestickPosCapt = busInputs.sec3.left_sidestick_roll_command_deg.Data;
    rollSidestickPosCaptValid = isNo(busInputs.sec3.left_sidestick_roll_command_deg);
    rollSidestickPosFo = busInputs.sec3.right_sidestick_roll_command_deg.Data;
    rollSidestickPosFoValid = isNo(busInputs.sec3.right_sidestick_roll_command_deg);
  } else if (isNo(busInputs.elac1.left_sidestick_roll_command_deg) || isNo(busInputs.elac1.right_sidestick_roll_command_deg)) {
    rollSidestickPosCapt = busInputs.elac1.left_sidestick_roll_command_deg.Data;
    rollSidestickPosCaptValid = isNo(busInputs.elac1.left_sidestick_roll_command_deg);
    rollSidestickPosFo = busInputs.elac1.right_sidestick_roll_command_deg.Data;
    rollSidestickPosFoValid = isNo(busInputs.elac1.right_sidestick_roll_command_deg);
  } else if (isNo(busInputs.elac2.left_sidestick_roll_command_deg) || isNo(busInputs.elac2.right_sidestick_roll_command_deg)) {
    rollSidestickPosCapt = busInputs.elac2.left_sidestick_roll_command_deg.Data;
    rollSidestickPosCaptValid = isNo(busInputs.elac2.left_sidestick_roll_command_deg);
    rollSidestickPosFo = busInputs.elac2.right_sidestick_roll_command_deg.Data;
    rollSidestickPosFoValid = isNo(busInputs.elac2.right_sidestick_roll_command_deg);
  } else if (isNo(busInputs.sec1.left_sidestick_roll_command_deg) || isNo(busInputs.sec1.right_sidestick_roll_command_deg)) {
    rollSidestickPosCapt = busInputs.sec1.left_sidestick_roll_command_deg.Data;
    rollSidestickPosCaptValid = isNo(busInputs.sec1.left_sidestick_roll_command_deg);
    rollSidestickPosFo = busInputs.sec1.right_sidestick_roll_command_deg.Data;
    rollSidestickPosFoValid = isNo(busInputs.sec1.right_sidestick_roll_command_deg);
  } else if (isNo(busInputs.sec2.left_sidestick_roll_command_deg) || isNo(busInputs.sec2.right_sidestick_roll_command_deg)) {
    rollSidestickPosCapt = busInputs.sec2.left_sidestick_roll_command_deg.Data;
    rollSidestickPosCaptValid = isNo(busInputs.sec2.left_sidestick_roll_command_deg);
    rollSidestickPosFo = busInputs.sec2.right_sidestick_roll_command_deg.Data;
    rollSidestickPosFoValid = isNo(busInputs.sec2.right_sidestick_roll_command_deg);
  } else if (isNo(busInputs.sec3.left_sidestick_roll_command_deg) || isNo(busInputs.sec3.right_sidestick_roll_command_deg)) {
    rollSidestickPosCapt = busInputs.sec3.left_sidestick_roll_command_deg.Data;
    rollSidestickPosCaptValid = isNo(busInputs.sec3.left_sidestick_roll_command_deg);
    rollSidestickPosFo = busInputs.sec3.right_sidestick_roll_command_deg.Data;
    rollSidestickPosFoValid = isNo(busInputs.sec3.right_sidestick_roll_command_deg);
  } else {
    rollSidestickPosCapt = 0;
    rollSidestickPosCaptValid = false;
    rollSidestickPosFo = 0;
    rollSidestickPosFoValid = false;
  }

  // Compute the rudder pedal position. First check if an ELAC is engaged in roll.
  // If one is, take that data. If none is engaged in roll, take the first valid data.
  // If none is valid, set data as invalid.
  if (elac1EngagedInRoll) {
    rudderPedalPos = busInputs.elac1.rudder_pedal_position_deg.Data;
    rudderPedalPosValid = isNo(busInputs.elac1.rudder_pedal_position_deg);
  } else if (elac2EngagedInRoll) {
    rudderPedalPos = busInputs.elac2.rudder_pedal_position_deg.Data;
    rudderPedalPosValid = isNo(busInputs.elac2.rudder_pedal_position_deg);
  } else if (isNo(busInputs.elac1.rudder_pedal_position_deg)) {
    rudderPedalPos = busInputs.elac1.rudder_pedal_position_deg.Data;
    rudderPedalPosValid = isNo(busInputs.elac1.rudder_pedal_position_deg);
  } else if (isNo(busInputs.elac2.rudder_pedal_position_deg)) {
    rudderPedalPos = busInputs.elac2.rudder_pedal_position_deg.Data;
    rudderPedalPosValid = isNo(busInputs.elac2.rudder_pedal_position_deg);
  } else {
    rudderPedalPos = 0;
    rudderPedalPosValid = false;
  }

  // Compute Elevator/THS data. Look at each surface individually: if the data from the computer that is
  // engaged in roll is valid, use that data. If not, take the data from the other computers.
  // If neither are valid, set the respective position as invalid.
  leftElevatorPosValid = true;
  if (elac2EngagedInPitch && isNo(busInputs.elac2.left_elevator_position_deg)) {
    leftElevatorPos = busInputs.elac2.left_elevator_position_deg.Data;
  } else if (elac1EngagedInPitch && isNo(busInputs.elac1.left_elevator_position_deg)) {
    leftElevatorPos = busInputs.elac1.left_elevator_position_deg.Data;
  } else if (sec2EngagedInPitch && isNo(busInputs.sec2.left_elevator_position_deg)) {
    leftElevatorPos = busInputs.sec2.left_elevator_position_deg.Data;
  } else if (sec1EngagedInPitch && isNo(busInputs.sec1.left_elevator_position_deg)) {
    leftElevatorPos = busInputs.sec1.left_elevator_position_deg.Data;
  } else if (isNo(busInputs.elac2.left_elevator_position_deg)) {
    leftElevatorPos = busInputs.elac2.left_elevator_position_deg.Data;
  } else if (isNo(busInputs.elac1.left_elevator_position_deg)) {
    leftElevatorPos = busInputs.elac1.left_elevator_position_deg.Data;
  } else if (isNo(busInputs.sec2.left_elevator_position_deg)) {
    leftElevatorPos = busInputs.sec2.left_elevator_position_deg.Data;
  } else if (isNo(busInputs.sec1.left_elevator_position_deg)) {
    leftElevatorPos = busInputs.sec1.left_elevator_position_deg.Data;
  } else {
    leftElevatorPos = 0;
    leftElevatorPosValid = false;
  }

  rightElevatorPosValid = true;
  if (elac2EngagedInPitch && isNo(busInputs.elac2.right_elevator_position_deg)) {
    rightElevatorPos = busInputs.elac2.right_elevator_position_deg.Data;
  } else if (elac1EngagedInPitch && isNo(busInputs.elac1.right_elevator_position_deg)) {
    rightElevatorPos = busInputs.elac1.right_elevator_position_deg.Data;
  } else if (sec2EngagedInPitch && isNo(busInputs.sec2.right_elevator_position_deg)) {
    rightElevatorPos = busInputs.sec2.right_elevator_position_deg.Data;
  } else if (sec1EngagedInPitch && isNo(busInputs.sec1.right_elevator_position_deg)) {
    rightElevatorPos = busInputs.sec1.right_elevator_position_deg.Data;
  } else if (isNo(busInputs.elac2.right_elevator_position_deg)) {
    rightElevatorPos = busInputs.elac2.right_elevator_position_deg.Data;
  } else if (isNo(busInputs.elac1.right_elevator_position_deg)) {
    rightElevatorPos = busInputs.elac1.right_elevator_position_deg.Data;
  } else if (isNo(busInputs.sec2.right_elevator_position_deg)) {
    rightElevatorPos = busInputs.sec2.right_elevator_position_deg.Data;
  } else if (isNo(busInputs.sec1.right_elevator_position_deg)) {
    rightElevatorPos = busInputs.sec1.right_elevator_position_deg.Data;
  } else {
    rightElevatorPos = 0;
    rightElevatorPosValid = false;
  }

  thsPosValid = true;
  if (elac2EngagedInPitch && isNo(busInputs.elac2.ths_position_deg)) {
    thsPos = busInputs.elac2.ths_position_deg.Data;
  } else if (elac1EngagedInPitch && isNo(busInputs.elac1.ths_position_deg)) {
    thsPos = busInputs.elac1.ths_position_deg.Data;
  } else if (sec2EngagedInPitch && isNo(busInputs.sec2.ths_position_deg)) {
    thsPos = busInputs.sec2.ths_position_deg.Data;
  } else if (sec1EngagedInPitch && isNo(busInputs.sec1.ths_position_deg)) {
    thsPos = busInputs.sec1.ths_position_deg.Data;
  } else if (isNo(busInputs.elac2.ths_position_deg)) {
    thsPos = busInputs.elac2.ths_position_deg.Data;
  } else if (isNo(busInputs.elac1.ths_position_deg)) {
    thsPos = busInputs.elac1.ths_position_deg.Data;
  } else if (isNo(busInputs.sec2.ths_position_deg)) {
    thsPos = busInputs.sec2.ths_position_deg.Data;
  } else if (isNo(busInputs.sec1.ths_position_deg)) {
    thsPos = busInputs.sec1.ths_position_deg.Data;
  } else {
    thsPos = 0;
    thsPosValid = false;
  }

  // Compute the sidestick positions in pitch. Always take the sidestick data
  // from the computer that is engaged in pitch axis.
  // If none is engaged in pitch, take the first valid data.
  // If none is valid, set data as invalid.
  if (elac2EngagedInPitch) {
    pitchSidestickPosCapt = busInputs.elac2.left_sidestick_pitch_command_deg.Data;
    pitchSidestickPosCaptValid = isNo(busInputs.elac2.left_sidestick_pitch_command_deg);
    pitchSidestickPosFo = busInputs.elac2.right_sidestick_pitch_command_deg.Data;
    pitchSidestickPosFoValid = isNo(busInputs.elac2.right_sidestick_pitch_command_deg);
  } else if (elac1EngagedInPitch) {
    pitchSidestickPosCapt = busInputs.elac1.left_sidestick_pitch_command_deg.Data;
    pitchSidestickPosCaptValid = isNo(busInputs.elac1.left_sidestick_pitch_command_deg);
    pitchSidestickPosFo = busInputs.elac1.right_sidestick_pitch_command_deg.Data;
    pitchSidestickPosFoValid = isNo(busInputs.elac1.right_sidestick_pitch_command_deg);
  } else if (sec2EngagedInPitch) {
    pitchSidestickPosCapt = busInputs.sec2.left_sidestick_pitch_command_deg.Data;
    pitchSidestickPosCaptValid = isNo(busInputs.sec2.left_sidestick_pitch_command_deg);
    pitchSidestickPosFo = busInputs.sec2.right_sidestick_pitch_command_deg.Data;
    pitchSidestickPosFoValid = isNo(busInputs.sec2.right_sidestick_pitch_command_deg);
  } else if (sec1EngagedInPitch) {
    pitchSidestickPosCapt = busInputs.sec1.left_sidestick_pitch_command_deg.Data;
    pitchSidestickPosCaptValid = isNo(busInputs.sec1.left_sidestick_pitch_command_deg);
    pitchSidestickPosFo = busInputs.sec1.right_sidestick_pitch_command_deg.Data;
    pitchSidestickPosFoValid = isNo(busInputs.sec1.right_sidestick_pitch_command_deg);
  } else if (isNo(busInputs.elac2.left_sidestick_pitch_command_deg) || isNo(busInputs.elac2.right_sidestick_pitch_command_deg)) {
    pitchSidestickPosCapt = busInputs.elac2.left_sidestick_pitch_command_deg.Data;
    pitchSidestickPosCaptValid = isNo(busInputs.elac2.left_sidestick_pitch_command_deg);
    pitchSidestickPosFo = busInputs.elac2.right_sidestick_pitch_command_deg.Data;
    pitchSidestickPosFoValid = isNo(busInputs.elac2.right_sidestick_pitch_command_deg);
  } else if (isNo(busInputs.elac1.left_sidestick_pitch_command_deg) || isNo(busInputs.elac1.right_sidestick_pitch_command_deg)) {
    pitchSidestickPosCapt = busInputs.elac1.left_sidestick_pitch_command_deg.Data;
    pitchSidestickPosCaptValid = isNo(busInputs.elac1.left_sidestick_pitch_command_deg);
    pitchSidestickPosFo = busInputs.elac1.right_sidestick_pitch_command_deg.Data;
    pitchSidestickPosFoValid = isNo(busInputs.elac1.right_sidestick_pitch_command_deg);
  } else if (isNo(busInputs.sec2.left_sidestick_pitch_command_deg) || isNo(busInputs.sec2.right_sidestick_pitch_command_deg)) {
    pitchSidestickPosCapt = busInputs.sec2.left_sidestick_pitch_command_deg.Data;
    pitchSidestickPosCaptValid = isNo(busInputs.sec2.left_sidestick_pitch_command_deg);
    pitchSidestickPosFo = busInputs.sec2.right_sidestick_pitch_command_deg.Data;
    pitchSidestickPosFoValid = isNo(busInputs.sec2.right_sidestick_pitch_command_deg);
  } else if (isNo(busInputs.sec1.left_sidestick_pitch_command_deg) || isNo(busInputs.sec1.right_sidestick_pitch_command_deg)) {
    pitchSidestickPosCapt = busInputs.sec1.left_sidestick_pitch_command_deg.Data;
    pitchSidestickPosCaptValid = isNo(busInputs.sec1.left_sidestick_pitch_command_deg);
    pitchSidestickPosFo = busInputs.sec1.right_sidestick_pitch_command_deg.Data;
    pitchSidestickPosFoValid = isNo(busInputs.sec1.right_sidestick_pitch_command_deg);
  } else {
    pitchSidestickPosCapt = 0;
    pitchSidestickPosCaptValid = false;
    pitchSidestickPosFo = 0;
    pitchSidestickPosFoValid = false;
  }
}

// Consolidate all the active law data from the different computers, and then compute
// the overall active system law from the law status of the computers that are engaged in the
// respective axes.
void Fcdc::computeActiveSystemLaws() {
  if (elac1EngagedInRoll) {
    systemLateralLaw = getLateralLawStatusFromBits(bitFromValue(busInputs.elac1.discrete_status_word_1, 26),
                                                   bitFromValue(busInputs.elac1.discrete_status_word_1, 27),
                                                   bitFromValue(busInputs.elac1.discrete_status_word_1, 28));
  } else if (elac2EngagedInRoll) {
    systemLateralLaw = getLateralLawStatusFromBits(bitFromValue(busInputs.elac2.discrete_status_word_1, 26),
                                                   bitFromValue(busInputs.elac2.discrete_status_word_1, 27),
                                                   bitFromValue(busInputs.elac2.discrete_status_word_1, 28));
  } else if (sec1EngagedInRoll || sec2EngagedInRoll || sec3EngagedInRoll) {
    systemLateralLaw = LateralLaw::DirectLaw;
  } else {
    systemLateralLaw = LateralLaw::None;
  }

  if (elac1EngagedInPitch) {
    systemPitchLaw = getPitchLawStatusFromBits(bitFromValue(busInputs.elac1.discrete_status_word_1, 23),
                                               bitFromValue(busInputs.elac1.discrete_status_word_1, 24),
                                               bitFromValue(busInputs.elac1.discrete_status_word_1, 25));
  } else if (elac2EngagedInPitch) {
    systemPitchLaw = getPitchLawStatusFromBits(bitFromValue(busInputs.elac2.discrete_status_word_1, 23),
                                               bitFromValue(busInputs.elac2.discrete_status_word_1, 24),
                                               bitFromValue(busInputs.elac2.discrete_status_word_1, 25));
  } else if (sec1EngagedInPitch) {
    systemPitchLaw = getPitchLawStatusFromBits(bitFromValue(busInputs.sec1.discrete_status_word_1, 19),
                                               bitFromValue(busInputs.sec1.discrete_status_word_1, 20),
                                               bitFromValue(busInputs.sec1.discrete_status_word_1, 21));
  } else if (sec2EngagedInPitch) {
    systemPitchLaw = getPitchLawStatusFromBits(bitFromValue(busInputs.sec2.discrete_status_word_1, 19),
                                               bitFromValue(busInputs.sec2.discrete_status_word_1, 20),
                                               bitFromValue(busInputs.sec2.discrete_status_word_1, 21));
  } else {
    systemPitchLaw = PitchLaw::None;
  }
}

void Fcdc::computeSidestickPriorityLights(double deltaTime) {
  bool leftSidestickDisabledRoll;
  bool rightSidestickDisabledRoll;
  bool leftSidestickDisabledPitch;
  bool rightSidestickDisabledPitch;
  bool leftSidestickPriorityLockedRoll;
  bool rightSidestickPriorityLockedRoll;
  bool leftSidestickPriorityLockedPitch;
  bool rightSidestickPriorityLockedPitch;

  // Compute if a sidestick has lost priority (per computer). Use the computer that is engaged in the respective axis.
  if (elac1EngagedInRoll) {
    leftSidestickDisabledRoll = bitFromValue(busInputs.elac1.discrete_status_word_2, 17);
    rightSidestickDisabledRoll = bitFromValue(busInputs.elac1.discrete_status_word_2, 18);
    leftSidestickPriorityLockedRoll = bitFromValue(busInputs.elac1.discrete_status_word_2, 19);
    rightSidestickPriorityLockedRoll = bitFromValue(busInputs.elac1.discrete_status_word_2, 20);
  } else if (elac2EngagedInRoll) {
    leftSidestickDisabledRoll = bitFromValue(busInputs.elac2.discrete_status_word_2, 17);
    rightSidestickDisabledRoll = bitFromValue(busInputs.elac2.discrete_status_word_2, 18);
    leftSidestickPriorityLockedRoll = bitFromValue(busInputs.elac2.discrete_status_word_2, 19);
    rightSidestickPriorityLockedRoll = bitFromValue(busInputs.elac2.discrete_status_word_2, 20);
  } else if (sec1EngagedInRoll || sec2EngagedInRoll || sec3EngagedInRoll) {
    leftSidestickDisabledRoll = bitFromValue(busInputs.sec1.discrete_status_word_2, 13) ||
                                bitFromValue(busInputs.sec2.discrete_status_word_2, 13) ||
                                bitFromValue(busInputs.sec3.discrete_status_word_2, 13);
    rightSidestickDisabledRoll = bitFromValue(busInputs.sec1.discrete_status_word_2, 14) ||
                                 bitFromValue(busInputs.sec2.discrete_status_word_2, 14) ||
                                 bitFromValue(busInputs.sec3.discrete_status_word_2, 14);
    leftSidestickPriorityLockedRoll = bitFromValue(busInputs.sec1.discrete_status_word_2, 15) ||
                                      bitFromValue(busInputs.sec2.discrete_status_word_2, 15) ||
                                      bitFromValue(busInputs.sec3.discrete_status_word_2, 15);
    rightSidestickPriorityLockedRoll = bitFromValue(busInputs.sec1.discrete_status_word_2, 16) ||
                                       bitFromValue(busInputs.sec2.discrete_status_word_2, 16) ||
                                       bitFromValue(busInputs.sec3.discrete_status_word_2, 16);
  }

  if (elac2EngagedInPitch) {
    leftSidestickDisabledPitch = bitFromValue(busInputs.elac2.discrete_status_word_2, 17);
    rightSidestickDisabledPitch = bitFromValue(busInputs.elac2.discrete_status_word_2, 18);
    leftSidestickPriorityLockedPitch = bitFromValue(busInputs.elac2.discrete_status_word_2, 19);
    rightSidestickPriorityLockedPitch = bitFromValue(busInputs.elac2.discrete_status_word_2, 20);
  } else if (elac1EngagedInPitch) {
    leftSidestickDisabledPitch = bitFromValue(busInputs.elac1.discrete_status_word_2, 17);
    rightSidestickDisabledPitch = bitFromValue(busInputs.elac1.discrete_status_word_2, 18);
    leftSidestickPriorityLockedPitch = bitFromValue(busInputs.elac1.discrete_status_word_2, 19);
    rightSidestickPriorityLockedPitch = bitFromValue(busInputs.elac1.discrete_status_word_2, 20);
  } else if (sec2EngagedInPitch) {
    leftSidestickDisabledPitch = bitFromValue(busInputs.sec2.discrete_status_word_2, 13);
    rightSidestickDisabledPitch = bitFromValue(busInputs.sec2.discrete_status_word_2, 14);
    leftSidestickPriorityLockedPitch = bitFromValue(busInputs.sec2.discrete_status_word_2, 15);
    rightSidestickPriorityLockedPitch = bitFromValue(busInputs.sec2.discrete_status_word_2, 16);
  } else if (sec1EngagedInPitch) {
    leftSidestickDisabledPitch = bitFromValue(busInputs.sec1.discrete_status_word_2, 13);
    rightSidestickDisabledPitch = bitFromValue(busInputs.sec1.discrete_status_word_2, 14);
    leftSidestickPriorityLockedPitch = bitFromValue(busInputs.sec1.discrete_status_word_2, 15);
    rightSidestickPriorityLockedPitch = bitFromValue(busInputs.sec1.discrete_status_word_2, 16);
  }

  // Compute the overall sidestick priority status. A sidestick has lost priority,
  // if at least one of the computers that is engaged in one axis has computed it as disabled.
  leftSidestickDisabled = leftSidestickDisabledPitch || leftSidestickDisabledRoll;
  rightSidestickDisabled = rightSidestickDisabledPitch || rightSidestickDisabledRoll;
  leftSidestickPriorityLocked = leftSidestickPriorityLockedPitch || leftSidestickPriorityLockedRoll;
  rightSidestickPriorityLocked = rightSidestickPriorityLockedPitch || rightSidestickPriorityLockedRoll;

  // Update light flashing clock
  if (priorityLightFlashingClock > 2 * LIGHT_FLASHING_PERIOD) {
    priorityLightFlashingClock = 0;
  } else {
    priorityLightFlashingClock += deltaTime;
  }
  bool flashingLightActive = priorityLightFlashingClock < LIGHT_FLASHING_PERIOD;

  // The red arrow light comes on in front of the pilot who has lost priority.
  leftRedPriorityLightOn = leftSidestickDisabled;
  rightRedPriorityLightOn = rightSidestickDisabled;

  bool leftSidestickPitchDeflected = std::abs(pitchSidestickPosCapt) >= 2 && pitchSidestickPosCaptValid;
  bool leftSidestickRollDeflected = std::abs(rollSidestickPosCapt) >= 2 && rollSidestickPosCaptValid;
  bool rightSidestickPitchDeflected = std::abs(pitchSidestickPosFo) >= 2 && pitchSidestickPosFoValid;
  bool rightSidestickRollDeflected = std::abs(rollSidestickPosFo) >= 2 && rollSidestickPosFoValid;
  // The green light comes on, in case of dual input, in which case it flashes,
  // or, if the other sidestick, which has lost priority, is deflected.
  if (!leftRedPriorityLightOn && !rightRedPriorityLightOn) {
    // This is the case where no side has taken priority, so check for dual input

    if ((leftSidestickPitchDeflected || leftSidestickRollDeflected) && (rightSidestickPitchDeflected || rightSidestickRollDeflected)) {
      leftGreenPriorityLightOn = flashingLightActive;
      rightGreenPriorityLightOn = flashingLightActive;
    } else {
      leftGreenPriorityLightOn = false;
      rightGreenPriorityLightOn = false;
    }
  } else {
    // This is the case where one sidestick has lost priority, so check if this sidestick is deflected.
    // If it is, illuminate the other light.
    if (leftSidestickDisabled && (leftSidestickPitchDeflected || leftSidestickRollDeflected)) {
      leftGreenPriorityLightOn = false;
      rightGreenPriorityLightOn = true;
    } else if (rightSidestickDisabled && (rightSidestickPitchDeflected || rightSidestickRollDeflected)) {
      leftGreenPriorityLightOn = true;
      rightGreenPriorityLightOn = false;
    } else {
      leftGreenPriorityLightOn = false;
      rightGreenPriorityLightOn = false;
    }
  }
}

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
    output.rudderPedalPosition.setSsm(Arinc429SignStatus::FailureWarning);
    output.captPitchCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.foPitchCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.aileronLeftPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.elevatorLeftPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.aileronRightPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.elevatorRightPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.horizStabTrimPos.setSsm(Arinc429SignStatus::FailureWarning);
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

    return output;
  }

  output.efcsStatus1.setSsm(Arinc429SignStatus::NormalOperation);
  output.efcsStatus1.setBit(11, systemPitchLaw == PitchLaw::NormalLaw);
  output.efcsStatus1.setBit(12, systemPitchLaw == PitchLaw::AlternateLaw1);
  output.efcsStatus1.setBit(13, systemPitchLaw == PitchLaw::AlternateLaw2);
  output.efcsStatus1.setBit(15, systemPitchLaw == PitchLaw::DirectLaw);
  output.efcsStatus1.setBit(16, systemLateralLaw == LateralLaw::NormalLaw);
  output.efcsStatus1.setBit(17, systemLateralLaw == LateralLaw::DirectLaw);
  output.efcsStatus1.setBit(18, false);  // No idea what this bit is supposed to mean
  output.efcsStatus1.setBit(19, bitFromValueOr(busInputs.elac1.discrete_status_word_1, 21, true));
  output.efcsStatus1.setBit(20, bitFromValueOr(busInputs.elac1.discrete_status_word_1, 22, true));
  output.efcsStatus1.setBit(21, bitFromValueOr(busInputs.elac2.discrete_status_word_1, 21, true));
  output.efcsStatus1.setBit(22, bitFromValueOr(busInputs.elac2.discrete_status_word_1, 22, true));
  output.efcsStatus1.setBit(23, !discreteInputs.elac1Valid);
  output.efcsStatus1.setBit(24, !discreteInputs.elac2Valid);
  output.efcsStatus1.setBit(25, !discreteInputs.sec1Valid);
  output.efcsStatus1.setBit(26, !discreteInputs.sec2Valid);
  output.efcsStatus1.setBit(27, false);
  output.efcsStatus1.setBit(28, discreteInputs.oppFcdcFailed);
  output.efcsStatus1.setBit(29, !discreteInputs.sec3Valid);

  bool leftElev1Fault = (!discreteInputs.elac1Valid || bitFromValueOr(busInputs.elac1.discrete_status_word_1, 21, false)) &&
                        (!discreteInputs.sec1Valid || bitFromValueOr(busInputs.sec1.discrete_status_word_1, 13, false));
  bool leftElev2Fault = (!discreteInputs.elac2Valid || bitFromValueOr(busInputs.elac2.discrete_status_word_1, 21, false)) &&
                        (!discreteInputs.sec2Valid || bitFromValueOr(busInputs.sec2.discrete_status_word_1, 13, false));
  bool rightElev1Fault = (!discreteInputs.elac1Valid || bitFromValueOr(busInputs.elac1.discrete_status_word_1, 21, false)) &&
                         (!discreteInputs.sec1Valid || bitFromValueOr(busInputs.sec1.discrete_status_word_1, 14, false));
  bool rightElev2Fault = (!discreteInputs.elac2Valid || bitFromValueOr(busInputs.elac2.discrete_status_word_1, 21, false)) &&
                         (!discreteInputs.sec2Valid || bitFromValueOr(busInputs.sec2.discrete_status_word_1, 14, false));

  output.efcsStatus2.setSsm(Arinc429SignStatus::NormalOperation);
  output.efcsStatus2.setBit(11, bitFromValueOr(busInputs.elac1.discrete_status_word_1, 11, true));
  output.efcsStatus2.setBit(12, bitFromValueOr(busInputs.elac2.discrete_status_word_1, 11, true));
  output.efcsStatus2.setBit(13, bitFromValueOr(busInputs.elac1.discrete_status_word_1, 12, true));
  output.efcsStatus2.setBit(14, bitFromValueOr(busInputs.elac2.discrete_status_word_1, 12, true));
  output.efcsStatus2.setBit(15, leftElev1Fault);
  output.efcsStatus2.setBit(16, leftElev2Fault);
  output.efcsStatus2.setBit(17, rightElev1Fault);
  output.efcsStatus2.setBit(18, rightElev2Fault);
  output.efcsStatus2.setBit(19, rightSidestickPriorityLocked);
  output.efcsStatus2.setBit(20, leftSidestickPriorityLocked);
  output.efcsStatus2.setBit(21, false);
  output.efcsStatus2.setBit(22, false);
  output.efcsStatus2.setBit(23, false);
  output.efcsStatus2.setBit(24, false);
  output.efcsStatus2.setBit(25, false);
  output.efcsStatus2.setBit(26, false);
  output.efcsStatus2.setBit(27, false);
  output.efcsStatus2.setBit(28, leftSidestickDisabled);
  output.efcsStatus2.setBit(29, rightSidestickDisabled);

  output.efcsStatus3.setSsm(Arinc429SignStatus::NormalOperation);
  output.efcsStatus3.setBit(11, bitFromValueOr(busInputs.elac1.discrete_status_word_1, 15, false));
  output.efcsStatus3.setBit(12, bitFromValueOr(busInputs.elac2.discrete_status_word_1, 15, false));
  output.efcsStatus3.setBit(13, bitFromValueOr(busInputs.elac1.discrete_status_word_1, 16, false));
  output.efcsStatus3.setBit(14, bitFromValueOr(busInputs.elac2.discrete_status_word_1, 16, false));
  output.efcsStatus3.setBit(15, bitFromValueOr(busInputs.elac1.discrete_status_word_1, 17, false) ||
                                    bitFromValueOr(busInputs.sec1.discrete_status_word_1, 17, false));
  output.efcsStatus3.setBit(16, bitFromValueOr(busInputs.elac2.discrete_status_word_1, 17, false) ||
                                    bitFromValueOr(busInputs.sec2.discrete_status_word_1, 17, false));
  output.efcsStatus3.setBit(17, bitFromValueOr(busInputs.elac1.discrete_status_word_1, 18, false) ||
                                    bitFromValueOr(busInputs.sec1.discrete_status_word_1, 18, false));
  output.efcsStatus3.setBit(18, bitFromValueOr(busInputs.elac2.discrete_status_word_1, 18, false) ||
                                    bitFromValueOr(busInputs.sec2.discrete_status_word_1, 18, false));
  output.efcsStatus3.setBit(19, discreteInputs.elac1Off);
  output.efcsStatus3.setBit(20, discreteInputs.elac2Off);
  output.efcsStatus3.setBit(21, bitFromValueOr(busInputs.sec3.discrete_status_word_1, 15, false));
  output.efcsStatus3.setBit(22, bitFromValueOr(busInputs.sec3.discrete_status_word_1, 16, false));
  output.efcsStatus3.setBit(23, bitFromValueOr(busInputs.sec1.discrete_status_word_1, 15, false));
  output.efcsStatus3.setBit(24, bitFromValueOr(busInputs.sec1.discrete_status_word_1, 16, false));
  output.efcsStatus3.setBit(25, bitFromValueOr(busInputs.sec2.discrete_status_word_1, 15, false));
  output.efcsStatus3.setBit(26, false);
  output.efcsStatus3.setBit(27, discreteInputs.sec1Off);
  output.efcsStatus3.setBit(28, discreteInputs.sec2Off);
  output.efcsStatus3.setBit(29, discreteInputs.sec3Off);

  output.efcsStatus4.setSsm(Arinc429SignStatus::NormalOperation);
  output.efcsStatus4.setBit(11, valueOr(busInputs.sec3.left_spoiler_1_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(12, valueOr(busInputs.sec3.right_spoiler_1_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(13, valueOr(busInputs.sec3.left_spoiler_2_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(14, valueOr(busInputs.sec3.right_spoiler_2_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(15, valueOr(busInputs.sec1.left_spoiler_1_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(16, valueOr(busInputs.sec1.right_spoiler_1_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(17, valueOr(busInputs.sec1.left_spoiler_2_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(18, valueOr(busInputs.sec1.right_spoiler_2_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(19, valueOr(busInputs.sec2.left_spoiler_1_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(20, valueOr(busInputs.sec2.right_spoiler_1_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(21, isNo(busInputs.sec3.left_spoiler_1_position_deg) && isNo(busInputs.sec3.right_spoiler_1_position_deg));
  output.efcsStatus4.setBit(22, isNo(busInputs.sec3.left_spoiler_2_position_deg) && isNo(busInputs.sec3.right_spoiler_2_position_deg));
  output.efcsStatus4.setBit(23, isNo(busInputs.sec1.left_spoiler_1_position_deg) && isNo(busInputs.sec1.right_spoiler_1_position_deg));
  output.efcsStatus4.setBit(24, isNo(busInputs.sec1.left_spoiler_2_position_deg) && isNo(busInputs.sec1.right_spoiler_2_position_deg));
  output.efcsStatus4.setBit(25, isNo(busInputs.sec2.left_spoiler_1_position_deg) && isNo(busInputs.sec2.right_spoiler_1_position_deg));
  output.efcsStatus4.setBit(26, bitFromValueOr(busInputs.sec1.discrete_status_word_1, 25, false) ||
                                    bitFromValueOr(busInputs.sec2.discrete_status_word_1, 25, false) ||
                                    bitFromValueOr(busInputs.sec3.discrete_status_word_1, 25, false));
  output.efcsStatus4.setBit(27, bitFromValueOr(busInputs.sec1.discrete_status_word_1, 26, false) ||
                                    bitFromValueOr(busInputs.sec2.discrete_status_word_1, 26, false) ||
                                    bitFromValueOr(busInputs.sec3.discrete_status_word_1, 26, false));
  output.efcsStatus4.setBit(28, valueOr(busInputs.sec1.speed_brake_lever_command_deg, 0) > 1.5 ||
                                    valueOr(busInputs.sec2.speed_brake_lever_command_deg, 0) > 1.5 ||
                                    valueOr(busInputs.sec3.speed_brake_lever_command_deg, 0) > 1.5);
  output.efcsStatus4.setBit(29, bitFromValueOr(busInputs.elac1.discrete_status_word_2, 21, false) ||
                                    bitFromValueOr(busInputs.elac2.discrete_status_word_2, 21, false));

  output.efcsStatus5.setSsm(Arinc429SignStatus::NormalOperation);
  output.efcsStatus5.setBit(11, !isNo(busInputs.sec1.speed_brake_lever_command_deg) && discreteInputs.sec1Valid);
  output.efcsStatus5.setBit(12, !isNo(busInputs.sec2.speed_brake_lever_command_deg) && discreteInputs.sec2Valid);
  output.efcsStatus5.setBit(13, !isNo(busInputs.sec3.speed_brake_lever_command_deg) && discreteInputs.sec3Valid);
  output.efcsStatus5.setBit(14, bitFromValueOr(busInputs.sec1.discrete_status_word_1, 24, false));
  output.efcsStatus5.setBit(15, bitFromValueOr(busInputs.sec2.discrete_status_word_1, 24, false));
  output.efcsStatus5.setBit(16, bitFromValueOr(busInputs.sec3.discrete_status_word_1, 24, false));
  output.efcsStatus5.setBit(17, false);
  output.efcsStatus5.setBit(18, false);
  output.efcsStatus5.setBit(19, false);
  output.efcsStatus5.setBit(20, false);
  output.efcsStatus5.setBit(21, bitFromValueOr(busInputs.sec3.discrete_status_word_1, 11, false));
  output.efcsStatus5.setBit(22, bitFromValueOr(busInputs.sec3.discrete_status_word_1, 12, false));
  output.efcsStatus5.setBit(23, bitFromValueOr(busInputs.sec1.discrete_status_word_1, 11, false));
  output.efcsStatus5.setBit(24, bitFromValueOr(busInputs.sec1.discrete_status_word_1, 12, false));
  output.efcsStatus5.setBit(25, bitFromValueOr(busInputs.sec2.discrete_status_word_1, 11, false));
  output.efcsStatus5.setBit(26, false);
  output.efcsStatus5.setBit(27, false);
  output.efcsStatus5.setBit(28, false);
  output.efcsStatus5.setBit(29, false);

  // Roll Data
  if (leftAileronPosValid) {
    output.aileronLeftPos.setFromData(leftAileronPos, Arinc429SignStatus::NormalOperation);
  } else {
    output.aileronLeftPos.setFromData(0, Arinc429SignStatus::FailureWarning);
  }

  if (rightAileronPosValid) {
    output.aileronRightPos.setFromData(rightAileronPos, Arinc429SignStatus::NormalOperation);
  } else {
    output.aileronRightPos.setFromData(0, Arinc429SignStatus::FailureWarning);
  }

  if (rollSidestickPosCaptValid) {
    output.captRollCommand.setFromData(rollSidestickPosCapt, Arinc429SignStatus::NormalOperation);
  } else {
    output.captRollCommand.setFromData(0, Arinc429SignStatus::FailureWarning);
  }

  if (rollSidestickPosFoValid) {
    output.foRollCommand.setFromData(rollSidestickPosFo, Arinc429SignStatus::NormalOperation);
  } else {
    output.foRollCommand.setFromData(0, Arinc429SignStatus::FailureWarning);
  }

  if (rudderPedalPosValid) {
    output.rudderPedalPosition.setFromData(rudderPedalPos, Arinc429SignStatus::NormalOperation);
  } else {
    output.rudderPedalPosition.setFromData(0, Arinc429SignStatus::FailureWarning);
  }

  // Pitch Data
  if (leftElevatorPosValid) {
    output.elevatorLeftPos.setFromData(leftElevatorPos, Arinc429SignStatus::NormalOperation);
  } else {
    output.elevatorLeftPos.setFromData(0, Arinc429SignStatus::FailureWarning);
  }

  if (rightElevatorPosValid) {
    output.elevatorRightPos.setFromData(rightElevatorPos, Arinc429SignStatus::NormalOperation);
  } else {
    output.elevatorRightPos.setFromData(0, Arinc429SignStatus::FailureWarning);
  }

  if (thsPosValid) {
    output.horizStabTrimPos.setFromData(thsPos, Arinc429SignStatus::NormalOperation);
  } else {
    output.horizStabTrimPos.setFromData(0, Arinc429SignStatus::FailureWarning);
  }

  if (pitchSidestickPosCaptValid) {
    output.captPitchCommand.setFromData(pitchSidestickPosCapt, Arinc429SignStatus::NormalOperation);
  } else {
    output.captPitchCommand.setFromData(0, Arinc429SignStatus::FailureWarning);
  }

  if (pitchSidestickPosFoValid) {
    output.foPitchCommand.setFromData(pitchSidestickPosFo, Arinc429SignStatus::NormalOperation);
  } else {
    output.foPitchCommand.setFromData(0, Arinc429SignStatus::FailureWarning);
  }

  if (isNo(busInputs.sec3.left_spoiler_1_position_deg)) {
    output.spoilerLeft1Pos.setFromData(busInputs.sec3.left_spoiler_1_position_deg.Data, Arinc429SignStatus::NormalOperation);
  } else {
    output.spoilerLeft1Pos.setFromData(0, Arinc429SignStatus::FailureWarning);
  }
  if (isNo(busInputs.sec3.right_spoiler_1_position_deg)) {
    output.spoilerRight1Pos.setFromData(busInputs.sec3.right_spoiler_1_position_deg.Data, Arinc429SignStatus::NormalOperation);
  } else {
    output.spoilerRight1Pos.setFromData(0, Arinc429SignStatus::FailureWarning);
  }

  if (isNo(busInputs.sec3.left_spoiler_2_position_deg)) {
    output.spoilerLeft2Pos.setFromData(busInputs.sec3.left_spoiler_2_position_deg.Data, Arinc429SignStatus::NormalOperation);
  } else {
    output.spoilerLeft2Pos.setFromData(0, Arinc429SignStatus::FailureWarning);
  }
  if (isNo(busInputs.sec3.right_spoiler_2_position_deg)) {
    output.spoilerRight2Pos.setFromData(busInputs.sec3.right_spoiler_2_position_deg.Data, Arinc429SignStatus::NormalOperation);
  } else {
    output.spoilerRight2Pos.setFromData(0, Arinc429SignStatus::FailureWarning);
  }

  if (isNo(busInputs.sec1.left_spoiler_1_position_deg)) {
    output.spoilerLeft3Pos.setFromData(busInputs.sec1.left_spoiler_1_position_deg.Data, Arinc429SignStatus::NormalOperation);
  } else {
    output.spoilerLeft3Pos.setFromData(0, Arinc429SignStatus::FailureWarning);
  }
  if (isNo(busInputs.sec1.right_spoiler_1_position_deg)) {
    output.spoilerRight3Pos.setFromData(busInputs.sec1.right_spoiler_1_position_deg.Data, Arinc429SignStatus::NormalOperation);
  } else {
    output.spoilerRight3Pos.setFromData(0, Arinc429SignStatus::FailureWarning);
  }

  if (isNo(busInputs.sec1.left_spoiler_2_position_deg)) {
    output.spoilerLeft4Pos.setFromData(busInputs.sec1.left_spoiler_2_position_deg.Data, Arinc429SignStatus::NormalOperation);
  } else {
    output.spoilerLeft4Pos.setFromData(0, Arinc429SignStatus::FailureWarning);
  }
  if (isNo(busInputs.sec1.right_spoiler_2_position_deg)) {
    output.spoilerRight4Pos.setFromData(busInputs.sec1.right_spoiler_2_position_deg.Data, Arinc429SignStatus::NormalOperation);
  } else {
    output.spoilerRight4Pos.setFromData(0, Arinc429SignStatus::FailureWarning);
  }

  if (isNo(busInputs.sec2.left_spoiler_1_position_deg)) {
    output.spoilerLeft5Pos.setFromData(busInputs.sec2.left_spoiler_1_position_deg.Data, Arinc429SignStatus::NormalOperation);
  } else {
    output.spoilerLeft5Pos.setFromData(0, Arinc429SignStatus::FailureWarning);
  }
  if (isNo(busInputs.sec2.right_spoiler_1_position_deg)) {
    output.spoilerRight5Pos.setFromData(busInputs.sec2.right_spoiler_1_position_deg.Data, Arinc429SignStatus::NormalOperation);
  } else {
    output.spoilerRight5Pos.setFromData(0, Arinc429SignStatus::FailureWarning);
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
    output.captRedPriorityLightOn = leftRedPriorityLightOn;
    output.captGreenPriorityLightOn = leftGreenPriorityLightOn;
    output.fcdcValid = true;
    output.foRedPriorityLightOn = rightRedPriorityLightOn;
    output.foGreenPriorityLightOn = rightGreenPriorityLightOn;
  }

  return output;
}
