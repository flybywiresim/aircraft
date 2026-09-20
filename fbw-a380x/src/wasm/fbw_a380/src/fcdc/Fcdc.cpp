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
  if (powerSupplyOutageTime <= 3.0 || !discreteInputs.noseGearPressed) {
    selfTestTimer = 0.5;
  } else {
    selfTestTimer = 3;
  }
  powerSupplyOutageTime = 0.0;
}

void Fcdc::update(double deltaTime, bool faultActive, bool isPowered) {
  monitorPowerSupply(deltaTime, isPowered);

  updateSelfTest(deltaTime);
  monitorSelf(faultActive);

  if (monitoringHealthy) {
    // Select master PRIM, use it for population of FCDC discrete words
    allPrimsDead = false;
    if (bitFromValueOr(busInputs.prims[0].fctl.fctl_law_status_word, 21, false)) {
      masterPrimIndex = 0;
    } else if (bitFromValueOr(busInputs.prims[1].fctl.fctl_law_status_word, 21, false)) {
      masterPrimIndex = 1;
    } else if (bitFromValueOr(busInputs.prims[2].fctl.fctl_law_status_word, 21, false)) {
      masterPrimIndex = 2;
    } else {
      allPrimsDead = true;
      masterPrimIndex = 0;
    }

    radioAlt = isNo(busInputs.raBusOutputs[0].radio_height_ft)   ? busInputs.raBusOutputs[0].radio_height_ft.Data
               : isNo(busInputs.raBusOutputs[1].radio_height_ft) ? busInputs.raBusOutputs[1].radio_height_ft.Data
                                                                 : busInputs.raBusOutputs[2].radio_height_ft.Data;

    updateApproachCapability(deltaTime);
    updateBtvRowRop(deltaTime);

    const auto modeReversionRequest = bitFromValueOr(busInputs.prims[masterPrimIndex].fg.discrete_word_5, 28, false);

    modeReversionTripleClickMtrig.write(modeReversionRequest, deltaTime);
  } else {
    previousLandCapacity = 0;
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
    output.efcsStatus6.setSsm(Arinc429SignStatus::FailureWarning);
    output.efcsStatus7.setSsm(Arinc429SignStatus::FailureWarning);
    output.efcsStatus8.setSsm(Arinc429SignStatus::FailureWarning);
    output.efcsStatus9.setSsm(Arinc429SignStatus::FailureWarning);
    output.efcsStatus10.setSsm(Arinc429SignStatus::FailureWarning);
    output.efcsStatus11.setSsm(Arinc429SignStatus::FailureWarning);

    output.captRollCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.foRollCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.rudderPedalPosition.setSsm(Arinc429SignStatus::FailureWarning);
    output.captPitchCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.foPitchCommand.setSsm(Arinc429SignStatus::FailureWarning);
    output.aileronLeftInnerPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.aileronLeftMiddlePos.setSsm(Arinc429SignStatus::FailureWarning);
    output.aileronLeftOuterPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.aileronRightInnerPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.aileronRightMiddlePos.setSsm(Arinc429SignStatus::FailureWarning);
    output.aileronRightOuterPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.elevatorLeftInnerPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.elevatorLeftOuterPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.elevatorRightInnerPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.elevatorRightOuterPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.horizStabTrimPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.rudderUpperPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.rudderLowerPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.rudderTrimPos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerLeft1Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerLeft2Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerLeft3Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerLeft4Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerLeft5Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerLeft6Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerLeft7Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerLeft8Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerRight1Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerRight2Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerRight3Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerRight4Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerRight5Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerRight6Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerRight7Pos.setSsm(Arinc429SignStatus::FailureWarning);
    output.spoilerRight8Pos.setSsm(Arinc429SignStatus::FailureWarning);

    output.fcdcFgDiscreteWord1.setSsm(Arinc429SignStatus::FailureWarning);
    output.fcdcFgDiscreteWord2.setSsm(Arinc429SignStatus::FailureWarning);
    output.fcdcFgDiscreteWord3.setSsm(Arinc429SignStatus::FailureWarning);

    return output;
  }

  Arinc429SignStatus ssm = Arinc429SignStatus::NormalOperation;

  PitchLaw systemPitchLaw = allPrimsDead
                                ? PitchLaw::DirectLaw
                                : getLawStatusFromBits(bitFromValue(busInputs.prims[masterPrimIndex].fctl.fctl_law_status_word, 16),
                                                       bitFromValue(busInputs.prims[masterPrimIndex].fctl.fctl_law_status_word, 17),
                                                       bitFromValue(busInputs.prims[masterPrimIndex].fctl.fctl_law_status_word, 18));

  const auto prim1Fault = !isNo(busInputs.prims[0].fctl.fctl_law_status_word);
  const auto prim2Fault = !isNo(busInputs.prims[1].fctl.fctl_law_status_word);
  const auto prim3Fault = !isNo(busInputs.prims[2].fctl.fctl_law_status_word);

  const auto sec1Fault = !isNo(busInputs.secs[0].fctl_law_status_word);
  const auto sec2Fault = !isNo(busInputs.secs[1].fctl_law_status_word);
  const auto sec3Fault = !isNo(busInputs.secs[2].fctl_law_status_word);

  output.efcsStatus1.setSsm(ssm);
  output.efcsStatus1.setBit(11, systemPitchLaw == PitchLaw::NormalLaw);
  output.efcsStatus1.setBit(12, systemPitchLaw == PitchLaw::AlternateLaw1A);
  output.efcsStatus1.setBit(13, systemPitchLaw == PitchLaw::AlternateLaw1B);
  output.efcsStatus1.setBit(14, systemPitchLaw == PitchLaw::AlternateLaw1C);
  output.efcsStatus1.setBit(15, systemPitchLaw == PitchLaw::AlternateLaw2A);
  output.efcsStatus1.setBit(16, systemPitchLaw == PitchLaw::AlternateLaw2B);
  output.efcsStatus1.setBit(18, systemPitchLaw == PitchLaw::DirectLaw);
  output.efcsStatus1.setBit(19, false);
  output.efcsStatus1.setBit(23, prim1Fault);
  output.efcsStatus1.setBit(24, prim2Fault);
  output.efcsStatus1.setBit(25, prim3Fault);
  output.efcsStatus1.setBit(26, sec1Fault);
  output.efcsStatus1.setBit(27, sec2Fault);
  output.efcsStatus1.setBit(28, sec3Fault);
  output.efcsStatus1.setBit(29, !discreteInputs.otherFcdcHealthy);

  const auto [prim1LeftAileron1Fault, prim1RightAileron1Fault, prim1LeftAileron2Fault, prim1RightAileron2Fault] =
      computeAileronStatusFromComputer(busInputs.prims[0].fctl.aileron_status_word, 2, true);

  const auto [prim2LeftAileron1Fault, prim2RightAileron1Fault, prim2LeftAileron2Fault, prim2RightAileron2Fault] =
      computeAileronStatusFromComputer(busInputs.prims[1].fctl.aileron_status_word, 2, true);

  const auto [prim3LeftAileron1Fault, prim3RightAileron1Fault, prim3LeftAileron2Fault, prim3RightAileron2Fault] =
      computeAileronStatusFromComputer(busInputs.prims[2].fctl.aileron_status_word, 2, true);

  const auto [sec1LeftAileron1Fault, sec1RightAileron1Fault, sec1LeftAileron2Fault, sec1RightAileron2Fault] =
      computeAileronStatusFromComputer(busInputs.secs[0].aileron_status_word, 2, true);

  const auto [sec2LeftAileron1Fault, sec2RightAileron1Fault, sec2LeftAileron2Fault, sec2RightAileron2Fault] =
      computeAileronStatusFromComputer(busInputs.secs[1].aileron_status_word, 2, true);

  const auto [sec3LeftAileron1Fault, sec3RightAileron1Fault, sec3LeftAileron2Fault, sec3RightAileron2Fault] =
      computeAileronStatusFromComputer(busInputs.secs[2].aileron_status_word, 2, true);

  output.efcsStatus2.setSsm(ssm);
  output.efcsStatus2.setBit(11, prim2LeftAileron2Fault && sec2LeftAileron2Fault);
  output.efcsStatus2.setBit(12, prim1LeftAileron1Fault && sec1LeftAileron1Fault);
  output.efcsStatus2.setBit(13, prim1LeftAileron2Fault && sec1LeftAileron2Fault);
  output.efcsStatus2.setBit(14, prim3LeftAileron1Fault && sec3LeftAileron1Fault);
  output.efcsStatus2.setBit(15, prim3LeftAileron2Fault);
  output.efcsStatus2.setBit(16, prim2LeftAileron1Fault);
  output.efcsStatus2.setBit(17, false);
  output.efcsStatus2.setBit(18, false);
  output.efcsStatus2.setBit(19, prim2RightAileron2Fault && sec2RightAileron2Fault);
  output.efcsStatus2.setBit(20, prim1RightAileron1Fault && sec1RightAileron1Fault);
  output.efcsStatus2.setBit(21, prim1RightAileron2Fault && sec1RightAileron2Fault);
  output.efcsStatus2.setBit(22, prim3RightAileron1Fault && sec3RightAileron1Fault);
  output.efcsStatus2.setBit(23, prim3RightAileron2Fault);
  output.efcsStatus2.setBit(24, prim2RightAileron1Fault);
  output.efcsStatus2.setBit(25, false);
  output.efcsStatus2.setBit(26, false);

  const auto [prim1LeftAileron1Avail, prim1RightAileron1Avail, prim1LeftAileron2Avail, prim1RightAileron2Avail] =
      computeAileronStatusFromComputer(busInputs.prims[0].fctl.aileron_status_word, 0, false);

  const auto [prim2LeftAileron1Avail, prim2RightAileron1Avail, prim2LeftAileron2Avail, prim2RightAileron2Avail] =
      computeAileronStatusFromComputer(busInputs.prims[1].fctl.aileron_status_word, 0, false);

  const auto [prim3LeftAileron1Avail, prim3RightAileron1Avail, prim3LeftAileron2Avail, prim3RightAileron2Avail] =
      computeAileronStatusFromComputer(busInputs.prims[2].fctl.aileron_status_word, 0, false);

  const auto [sec1LeftAileron1Avail, sec1RightAileron1Avail, sec1LeftAileron2Avail, sec1RightAileron2Avail] =
      computeAileronStatusFromComputer(busInputs.secs[0].aileron_status_word, 0, false);

  const auto [sec2LeftAileron1Avail, sec2RightAileron1Avail, sec2LeftAileron2Avail, sec2RightAileron2Avail] =
      computeAileronStatusFromComputer(busInputs.secs[1].aileron_status_word, 0, false);

  const auto [sec3LeftAileron1Avail, sec3RightAileron1Avail, sec3LeftAileron2Avail, sec3RightAileron2Avail] =
      computeAileronStatusFromComputer(busInputs.secs[2].aileron_status_word, 0, false);

  output.efcsStatus3.setSsm(ssm);
  output.efcsStatus3.setBit(11, prim2LeftAileron2Avail || sec2LeftAileron2Avail);
  output.efcsStatus3.setBit(12, prim1LeftAileron1Avail || sec1LeftAileron1Avail);
  output.efcsStatus3.setBit(13, prim1LeftAileron2Avail || sec1LeftAileron2Avail);
  output.efcsStatus3.setBit(14, prim3LeftAileron1Avail || sec3LeftAileron1Avail);
  output.efcsStatus3.setBit(15, prim3LeftAileron2Avail);
  output.efcsStatus3.setBit(16, prim2LeftAileron1Avail);
  output.efcsStatus3.setBit(19, prim2RightAileron2Avail || sec2RightAileron2Avail);
  output.efcsStatus3.setBit(20, prim1RightAileron1Avail || sec1RightAileron1Avail);
  output.efcsStatus3.setBit(21, prim1RightAileron2Avail || sec1RightAileron2Avail);
  output.efcsStatus3.setBit(22, prim3RightAileron1Avail || sec3RightAileron1Avail);
  output.efcsStatus3.setBit(23, prim3RightAileron2Avail);
  output.efcsStatus3.setBit(24, prim2RightAileron1Avail);

  const auto [prim1Elevator1Fault, prim1Elevator2Fault, prim1Elevator3Fault, prim1ThsFault] =
      computeElevatorStatusFromComputer(busInputs.prims[0].fctl.elevator_status_word, 2, true);

  const auto [prim2Elevator1Fault, prim2Elevator2Fault, prim2Elevator3Fault, prim2ThsFault] =
      computeElevatorStatusFromComputer(busInputs.prims[1].fctl.elevator_status_word, 2, true);

  const auto [prim3Elevator1Fault, prim3Elevator2Fault, prim3Elevator3Fault, prim3ThsFault] =
      computeElevatorStatusFromComputer(busInputs.prims[2].fctl.elevator_status_word, 2, true);

  const auto [sec1Elevator1Fault, sec1Elevator2Fault, sec1Elevator3Fault, sec1ThsFault] =
      computeElevatorStatusFromComputer(busInputs.secs[0].elevator_status_word, 2, true);

  const auto [sec2Elevator1Fault, sec2Elevator2Fault, sec2Elevator3Fault, sec2ThsFault] =
      computeElevatorStatusFromComputer(busInputs.secs[1].elevator_status_word, 2, true);

  const auto [sec3Elevator1Fault, sec3Elevator2Fault, sec3Elevator3Fault, sec3ThsFault] =
      computeElevatorStatusFromComputer(busInputs.secs[2].elevator_status_word, 2, true);

  output.efcsStatus4.setSsm(ssm);
  output.efcsStatus4.setBit(11, prim1Elevator2Fault && sec1Elevator2Fault);
  output.efcsStatus4.setBit(12, prim3Elevator1Fault && sec3Elevator1Fault);
  output.efcsStatus4.setBit(13, prim2Elevator2Fault && sec2Elevator2Fault);
  output.efcsStatus4.setBit(14, prim1Elevator1Fault && sec1Elevator1Fault);
  output.efcsStatus4.setBit(15, false);
  output.efcsStatus4.setBit(16, false);
  output.efcsStatus4.setBit(17, prim2Elevator3Fault && sec2Elevator3Fault);
  output.efcsStatus4.setBit(18, prim3Elevator2Fault && sec3Elevator2Fault);
  output.efcsStatus4.setBit(19, prim1Elevator3Fault && sec1Elevator3Fault);
  output.efcsStatus4.setBit(20, prim2Elevator1Fault && sec2Elevator1Fault);
  output.efcsStatus4.setBit(21, false);
  output.efcsStatus4.setBit(22, false);
  output.efcsStatus4.setBit(25, prim3ThsFault && sec3ThsFault);
  output.efcsStatus4.setBit(26, prim1ThsFault && sec1ThsFault);
  output.efcsStatus4.setBit(27, prim2ThsFault);
  output.efcsStatus4.setBit(29, false);

  const auto [prim1Elevator1Avail, prim1Elevator2Avail, prim1Elevator3Avail, prim1ThsAvail] =
      computeElevatorStatusFromComputer(busInputs.prims[0].fctl.elevator_status_word, 0, false);

  const auto [prim2Elevator1Avail, prim2Elevator2Avail, prim2Elevator3Avail, prim2ThsAvail] =
      computeElevatorStatusFromComputer(busInputs.prims[1].fctl.elevator_status_word, 0, false);

  const auto [prim3Elevator1Avail, prim3Elevator2Avail, prim3Elevator3Avail, prim3ThsAvail] =
      computeElevatorStatusFromComputer(busInputs.prims[2].fctl.elevator_status_word, 0, false);

  const auto [sec1Elevator1Avail, sec1Elevator2Avail, sec1Elevator3Avail, sec1ThsAvail] =
      computeElevatorStatusFromComputer(busInputs.secs[0].elevator_status_word, 0, false);

  const auto [sec2Elevator1Avail, sec2Elevator2Avail, sec2Elevator3Avail, sec2ThsAvail] =
      computeElevatorStatusFromComputer(busInputs.secs[1].elevator_status_word, 0, false);

  const auto [sec3Elevator1Avail, sec3Elevator2Avail, sec3Elevator3Avail, sec3ThsAvail] =
      computeElevatorStatusFromComputer(busInputs.secs[2].elevator_status_word, 0, false);

  output.efcsStatus5.setSsm(ssm);
  output.efcsStatus5.setBit(11, prim1Elevator2Avail || sec1Elevator2Avail);
  output.efcsStatus5.setBit(12, prim3Elevator1Avail || sec3Elevator1Avail);
  output.efcsStatus5.setBit(13, prim2Elevator2Avail || sec2Elevator2Avail);
  output.efcsStatus5.setBit(14, prim1Elevator1Avail || sec1Elevator1Avail);
  output.efcsStatus5.setBit(17, prim2Elevator3Avail || sec2Elevator3Avail);
  output.efcsStatus5.setBit(18, prim3Elevator2Avail || sec3Elevator2Avail);
  output.efcsStatus5.setBit(19, prim1Elevator3Avail || sec1Elevator3Avail);
  output.efcsStatus5.setBit(20, prim2Elevator1Avail || sec2Elevator1Avail);
  output.efcsStatus5.setBit(25, prim3ThsAvail || sec3ThsAvail);
  output.efcsStatus5.setBit(26, prim1ThsAvail || sec1ThsAvail);
  output.efcsStatus5.setBit(27, prim2ThsAvail);

  const auto [prim1Rudder1HydAvail, prim1Rudder1ElecAvail, prim1Rudder2HydAvail, prim1Rudder2ElecAvail] =
      computeRudderStatusFromComputer(busInputs.prims[0].fctl.rudder_status_word, 0, false);

  const auto [prim2Rudder1HydAvail, prim2Rudder1ElecAvail, prim2Rudder2HydAvail, prim2Rudder2ElecAvail] =
      computeRudderStatusFromComputer(busInputs.prims[1].fctl.rudder_status_word, 0, false);

  const auto [prim3Rudder1HydAvail, prim3Rudder1ElecAvail, prim3Rudder2HydAvail, prim3Rudder2ElecAvail] =
      computeRudderStatusFromComputer(busInputs.prims[2].fctl.rudder_status_word, 0, false);

  const auto [sec1Rudder1HydAvail, sec1Rudder1ElecAvail, sec1Rudder2HydAvail, sec1Rudder2ElecAvail] =
      computeRudderStatusFromComputer(busInputs.secs[0].rudder_status_word, 0, false);

  const auto [sec2Rudder1HydAvail, sec2Rudder1ElecAvail, sec2Rudder2HydAvail, sec2Rudder2ElecAvail] =
      computeRudderStatusFromComputer(busInputs.secs[1].rudder_status_word, 0, false);

  const auto [sec3Rudder1HydAvail, sec3Rudder1ElecAvail, sec3Rudder2HydAvail, sec3Rudder2ElecAvail] =
      computeRudderStatusFromComputer(busInputs.secs[2].rudder_status_word, 0, false);

  const auto [prim1Rudder1Fault, prim1Rudder1ElecFault, prim1Rudder2Fault, prim1Rudder2ElecFault] =
      computeRudderStatusFromComputer(busInputs.prims[0].fctl.rudder_status_word, 2, true);

  const auto [prim2Rudder1Fault, prim2Rudder1ElecFault, prim2Rudder2Fault, prim2Rudder2ElecFault] =
      computeRudderStatusFromComputer(busInputs.prims[1].fctl.rudder_status_word, 2, true);

  const auto [prim3Rudder1Fault, prim3Rudder1ElecFault, prim3Rudder2Fault, prim3Rudder2ElecFault] =
      computeRudderStatusFromComputer(busInputs.prims[2].fctl.rudder_status_word, 2, true);

  const auto [sec1Rudder1Fault, sec1Rudder1ElecFault, sec1Rudder2Fault, sec1Rudder2ElecFault] =
      computeRudderStatusFromComputer(busInputs.secs[0].rudder_status_word, 2, true);

  const auto [sec2Rudder1Fault, sec2Rudder1ElecFault, sec2Rudder2Fault, sec2Rudder2ElecFault] =
      computeRudderStatusFromComputer(busInputs.secs[1].rudder_status_word, 2, true);

  const auto [sec3Rudder1Fault, sec3Rudder1ElecFault, sec3Rudder2Fault, sec3Rudder2ElecFault] =
      computeRudderStatusFromComputer(busInputs.secs[2].rudder_status_word, 2, true);

  output.efcsStatus6.setSsm(ssm);
  output.efcsStatus6.setBit(11, prim1Rudder1Fault && sec1Rudder1Fault);
  output.efcsStatus6.setBit(12, prim2Rudder1Fault && sec2Rudder1Fault);
  output.efcsStatus6.setBit(13, prim1Rudder1ElecFault && sec1Rudder1ElecFault);
  output.efcsStatus6.setBit(14, prim2Rudder1ElecFault && sec2Rudder1ElecFault);
  output.efcsStatus6.setBit(15, prim1Rudder2Fault && sec1Rudder2Fault);
  output.efcsStatus6.setBit(16, prim3Rudder1Fault && sec3Rudder1Fault);
  output.efcsStatus6.setBit(17, prim1Rudder2ElecFault && sec1Rudder2ElecFault);
  output.efcsStatus6.setBit(18, prim3Rudder1ElecFault && sec3Rudder1ElecFault);
  output.efcsStatus6.setBit(19, prim1Rudder1Fault);
  output.efcsStatus6.setBit(20, prim1Rudder2Fault);
  output.efcsStatus6.setBit(21, prim2Rudder1Fault);
  output.efcsStatus6.setBit(22, prim3Rudder1Fault);
  output.efcsStatus6.setBit(25, prim1Rudder1HydAvail || sec1Rudder1HydAvail || prim1Rudder1ElecAvail || sec1Rudder1ElecAvail);
  output.efcsStatus6.setBit(26, prim2Rudder1HydAvail || sec2Rudder1HydAvail || prim2Rudder1ElecAvail || sec2Rudder1ElecAvail);
  output.efcsStatus6.setBit(27, prim1Rudder2HydAvail || sec1Rudder2HydAvail || prim1Rudder2ElecAvail || sec1Rudder2ElecAvail);
  output.efcsStatus6.setBit(28, prim3Rudder1HydAvail || sec3Rudder1HydAvail || prim3Rudder1ElecAvail || sec3Rudder1ElecAvail);

  const auto [prim1LeftSpoilerHydFault, prim1LeftSpoilerElecFault, prim1RightSpoilerHydFault, prim1RightSpoilerElecFault] =
      computeSpoilerStatusFromPrim(busInputs.prims[0].fctl.spoiler_status_word, 2, true);

  const auto [prim2LeftSpoilerHydFault, prim2LeftSpoilerElecFault, prim2RightSpoilerHydFault, prim2RightSpoilerElecFault] =
      computeSpoilerStatusFromPrim(busInputs.prims[1].fctl.spoiler_status_word, 2, true);

  const auto [prim3LeftSpoilerHydFault, prim3LeftSpoilerElecFault, prim3RightSpoilerHydFault, prim3RightSpoilerElecFault] =
      computeSpoilerStatusFromPrim(busInputs.prims[2].fctl.spoiler_status_word, 2, true);

  const auto [sec1LeftSpoiler1Fault, sec1RightSpoiler1Fault, sec1LeftSpoiler2Fault, sec1RightSpoiler2Fault] =
      computeSpoilerStatusFromSec(busInputs.secs[0].spoiler_status_word, 2, true);

  const auto [sec2LeftSpoiler1Fault, sec2RightSpoiler1Fault, sec2LeftSpoiler2Fault, sec2RightSpoiler2Fault] =
      computeSpoilerStatusFromSec(busInputs.secs[1].spoiler_status_word, 2, true);

  const auto [sec3LeftSpoiler1Fault, sec3RightSpoiler1Fault, sec3LeftSpoiler2Fault, sec3RightSpoiler2Fault] =
      computeSpoilerStatusFromSec(busInputs.secs[2].spoiler_status_word, 2, true);

  output.efcsStatus7.setSsm(ssm);
  output.efcsStatus7.setBit(11, sec3LeftSpoiler1Fault || sec3RightSpoiler1Fault);
  output.efcsStatus7.setBit(12, sec2LeftSpoiler1Fault || sec2RightSpoiler1Fault);
  output.efcsStatus7.setBit(13, sec1LeftSpoiler1Fault || sec1RightSpoiler1Fault);
  output.efcsStatus7.setBit(14, sec2LeftSpoiler2Fault || sec2RightSpoiler2Fault);
  output.efcsStatus7.setBit(15, sec3LeftSpoiler2Fault || sec3RightSpoiler2Fault);
  output.efcsStatus7.setBit(16, prim3LeftSpoilerHydFault && prim3LeftSpoilerElecFault);
  output.efcsStatus7.setBit(17, prim2LeftSpoilerHydFault && prim2LeftSpoilerElecFault);
  output.efcsStatus7.setBit(18, prim1LeftSpoilerHydFault && prim1LeftSpoilerElecFault);
  output.efcsStatus7.setBit(19, prim3RightSpoilerHydFault && prim3RightSpoilerElecFault);
  output.efcsStatus7.setBit(20, prim2RightSpoilerHydFault && prim2RightSpoilerElecFault);
  output.efcsStatus7.setBit(21, prim1RightSpoilerHydFault && prim1RightSpoilerElecFault);
  output.efcsStatus7.setBit(26, false);
  output.efcsStatus7.setBit(27, false);
  output.efcsStatus7.setBit(28, false);
  output.efcsStatus7.setBit(29, false);

  const auto [prim1LeftSpoilerHydAvail, prim1LeftSpoilerElecAvail, prim1RightSpoilerHydAvail, prim1RightSpoilerElecAvail] =
      computeSpoilerStatusFromPrim(busInputs.prims[0].fctl.spoiler_status_word, 0, false);

  const auto [prim2LeftSpoilerHydAvail, prim2LeftSpoilerElecAvail, prim2RightSpoilerHydAvail, prim2RightSpoilerElecAvail] =
      computeSpoilerStatusFromPrim(busInputs.prims[1].fctl.spoiler_status_word, 0, false);

  const auto [prim3LeftSpoilerHydAvail, prim3LeftSpoilerElecAvail, prim3RightSpoilerHydAvail, prim3RightSpoilerElecAvail] =
      computeSpoilerStatusFromPrim(busInputs.prims[2].fctl.spoiler_status_word, 0, false);

  const auto [sec1LeftSpoiler1Avail, sec1RightSpoiler1Avail, sec1LeftSpoiler2Avail, sec1RightSpoiler2Avail] =
      computeSpoilerStatusFromSec(busInputs.secs[0].spoiler_status_word, 0, false);

  const auto [sec2LeftSpoiler1Avail, sec2RightSpoiler1Avail, sec2LeftSpoiler2Avail, sec2RightSpoiler2Avail] =
      computeSpoilerStatusFromSec(busInputs.secs[1].spoiler_status_word, 0, false);

  const auto [sec3LeftSpoiler1Avail, sec3RightSpoiler1Avail, sec3LeftSpoiler2Avail, sec3RightSpoiler2Avail] =
      computeSpoilerStatusFromSec(busInputs.secs[2].spoiler_status_word, 0, false);

  output.efcsStatus8.setSsm(ssm);
  output.efcsStatus8.setBit(11, sec3LeftSpoiler1Avail && sec3RightSpoiler1Avail);
  output.efcsStatus8.setBit(12, sec2LeftSpoiler1Avail && sec2RightSpoiler1Avail);
  output.efcsStatus8.setBit(13, sec1LeftSpoiler1Avail && sec1RightSpoiler1Avail);
  output.efcsStatus8.setBit(14, sec2LeftSpoiler2Avail && sec2RightSpoiler2Avail);
  output.efcsStatus8.setBit(15, sec3LeftSpoiler2Avail && sec3RightSpoiler2Avail);
  output.efcsStatus8.setBit(16, prim3LeftSpoilerHydAvail || prim3LeftSpoilerElecAvail);
  output.efcsStatus8.setBit(17, prim2LeftSpoilerHydAvail || prim2LeftSpoilerElecAvail);
  output.efcsStatus8.setBit(18, prim1LeftSpoilerHydAvail || prim1LeftSpoilerElecAvail);
  output.efcsStatus8.setBit(19, prim3RightSpoilerHydAvail || prim3RightSpoilerElecAvail);
  output.efcsStatus8.setBit(20, prim2RightSpoilerHydAvail || prim2RightSpoilerElecAvail);
  output.efcsStatus8.setBit(21, prim1RightSpoilerHydAvail || prim1RightSpoilerElecAvail);
  output.efcsStatus8.setBit(25, false);
  output.efcsStatus8.setBit(26, false);
  output.efcsStatus8.setBit(27, false);
  output.efcsStatus8.setBit(28, false);
  output.efcsStatus8.setBit(29, false);

  output.efcsStatus9.setSsm(ssm);
  output.efcsStatus9.setBit(11, bitFromValueOr(busInputs.secs[0].rudder_status_word, 29, true));
  output.efcsStatus9.setBit(12, bitFromValueOr(busInputs.secs[2].rudder_status_word, 29, true));
  output.efcsStatus9.setBit(13, bitFromValueOr(busInputs.secs[0].rudder_status_word, 27, false));
  output.efcsStatus9.setBit(14, bitFromValueOr(busInputs.secs[2].rudder_status_word, 27, false));
  output.efcsStatus9.setBit(15, false);
  output.efcsStatus9.setBit(18, false);
  output.efcsStatus9.setBit(19, false);
  output.efcsStatus9.setBit(20, false);
  output.efcsStatus9.setBit(25, false);
  output.efcsStatus9.setBit(26, false);
  output.efcsStatus9.setBit(27, false);
  output.efcsStatus9.setBit(28, false);
  output.efcsStatus9.setBit(29, false);

  const auto prim1LawCap = getLawStatusFromBits(bitFromValue(busInputs.prims[0].fctl.fctl_law_status_word, 11),
                                                bitFromValue(busInputs.prims[0].fctl.fctl_law_status_word, 12),
                                                bitFromValue(busInputs.prims[0].fctl.fctl_law_status_word, 13));

  const auto prim2LawCap = getLawStatusFromBits(bitFromValue(busInputs.prims[1].fctl.fctl_law_status_word, 11),
                                                bitFromValue(busInputs.prims[1].fctl.fctl_law_status_word, 12),
                                                bitFromValue(busInputs.prims[1].fctl.fctl_law_status_word, 13));

  const auto prim3LawCap = getLawStatusFromBits(bitFromValue(busInputs.prims[1].fctl.fctl_law_status_word, 11),
                                                bitFromValue(busInputs.prims[1].fctl.fctl_law_status_word, 12),
                                                bitFromValue(busInputs.prims[1].fctl.fctl_law_status_word, 13));

  output.efcsStatus10.setSsm(ssm);
  output.efcsStatus10.setBit(11, discreteInputs.primOff[0]);
  output.efcsStatus10.setBit(12, discreteInputs.primOff[1]);
  output.efcsStatus10.setBit(13, discreteInputs.primOff[2]);
  output.efcsStatus10.setBit(14, discreteInputs.secOff[0]);
  output.efcsStatus10.setBit(15, discreteInputs.secOff[1]);
  output.efcsStatus10.setBit(16, discreteInputs.secOff[2]);
  output.efcsStatus10.setBit(18, false);
  output.efcsStatus10.setBit(19, prim1LawCap != PitchLaw::NormalLaw);
  output.efcsStatus10.setBit(20, prim2LawCap != PitchLaw::NormalLaw);
  output.efcsStatus10.setBit(25, prim3LawCap != PitchLaw::NormalLaw);
  output.efcsStatus10.setBit(26, false);
  output.efcsStatus10.setBit(27, false);

  output.efcsStatus11.setSsm(ssm);

  output.efcsStatus12.setSsm(ssm);
  output.efcsStatus12.setBit(11, prim1Elevator2Fault);
  output.efcsStatus12.setBit(12, prim1Elevator1Fault);
  output.efcsStatus12.setBit(13, prim1Elevator3Fault);
  output.efcsStatus12.setBit(14, prim2Elevator2Fault);
  output.efcsStatus12.setBit(15, prim2Elevator3Fault);
  output.efcsStatus12.setBit(16, prim2Elevator1Fault);
  output.efcsStatus12.setBit(17, prim3Elevator1Fault);
  output.efcsStatus12.setBit(18, prim3Elevator2Fault);
  output.efcsStatus12.setBit(23, true);
  output.efcsStatus12.setBit(24, discreteInputs.acEssAvail);
  output.efcsStatus12.setBit(25, discreteInputs.ac1Avail);
  output.efcsStatus12.setBit(26, discreteInputs.acEhaAvail);
  // TODO Hyd info should come from F/CTL Computers
  output.efcsStatus12.setBit(27, !(prim1Fault && prim2Fault && prim3Fault && sec1Fault && sec2Fault && sec3Fault));
  output.efcsStatus12.setBit(28, discreteInputs.greenHydraulicAvailable);
  output.efcsStatus12.setBit(29, discreteInputs.yellowHydraulicAvailable);

  auto setSurfacePosition4 = [&](Arinc429NumericWord& target, base_arinc_429 pos1, base_arinc_429 pos2, base_arinc_429 pos3,
                                 base_arinc_429 pos4) {
    const auto [surfacePosition, surfacePositionValid] = computeSurfacePosition(pos1, pos2, pos3, pos4);
    target.setFromData(surfacePosition, surfacePositionValid ? Arinc429SignStatus::NormalOperation : Arinc429SignStatus::NoComputedData);
  };

  auto setSurfacePosition2 = [&](Arinc429NumericWord& target, base_arinc_429 pos1, base_arinc_429 pos2) {
    const auto [surfacePosition, surfacePositionValid] = computeSurfacePosition(pos1, pos2);
    target.setFromData(surfacePosition, surfacePositionValid ? Arinc429SignStatus::NormalOperation : Arinc429SignStatus::NoComputedData);
  };

  setSurfacePosition4(output.captPitchCommand, busInputs.prims[masterPrimIndex].fctl.left_sidestick_pitch_command_deg,
                      busInputs.secs[0].left_sidestick_pitch_command_deg, busInputs.secs[1].left_sidestick_pitch_command_deg,
                      busInputs.secs[2].left_sidestick_pitch_command_deg);
  setSurfacePosition4(output.captRollCommand, busInputs.prims[masterPrimIndex].fctl.left_sidestick_roll_command_deg,
                      busInputs.secs[0].left_sidestick_roll_command_deg, busInputs.secs[1].left_sidestick_roll_command_deg,
                      busInputs.secs[2].left_sidestick_roll_command_deg);
  setSurfacePosition4(output.foPitchCommand, busInputs.prims[masterPrimIndex].fctl.right_sidestick_pitch_command_deg,
                      busInputs.secs[0].right_sidestick_pitch_command_deg, busInputs.secs[1].right_sidestick_pitch_command_deg,
                      busInputs.secs[2].right_sidestick_pitch_command_deg);
  setSurfacePosition4(output.foRollCommand, busInputs.prims[masterPrimIndex].fctl.right_sidestick_roll_command_deg,
                      busInputs.secs[0].right_sidestick_roll_command_deg, busInputs.secs[1].right_sidestick_roll_command_deg,
                      busInputs.secs[2].right_sidestick_roll_command_deg);
  setSurfacePosition4(output.foRollCommand, busInputs.prims[masterPrimIndex].fctl.rudder_pedal_position_deg,
                      busInputs.secs[0].rudder_pedal_position_deg, busInputs.secs[1].rudder_pedal_position_deg,
                      busInputs.secs[2].rudder_pedal_position_deg);

  setSurfacePosition4(output.aileronLeftInnerPos, busInputs.prims[0].fctl.left_aileron_1_position_deg,
                      busInputs.prims[1].fctl.left_aileron_2_position_deg, busInputs.secs[0].left_aileron_1_position_deg,
                      busInputs.secs[1].left_aileron_2_position_deg);
  setSurfacePosition4(output.aileronLeftMiddlePos, busInputs.prims[2].fctl.left_aileron_1_position_deg,
                      busInputs.prims[0].fctl.left_aileron_2_position_deg, busInputs.secs[2].left_aileron_1_position_deg,
                      busInputs.secs[0].left_aileron_2_position_deg);
  setSurfacePosition2(output.aileronLeftOuterPos, busInputs.prims[1].fctl.left_aileron_1_position_deg,
                      busInputs.prims[2].fctl.left_aileron_2_position_deg);

  setSurfacePosition4(output.aileronRightInnerPos, busInputs.prims[0].fctl.right_aileron_1_position_deg,
                      busInputs.prims[1].fctl.right_aileron_2_position_deg, busInputs.secs[0].right_aileron_1_position_deg,
                      busInputs.secs[1].right_aileron_2_position_deg);
  setSurfacePosition4(output.aileronRightMiddlePos, busInputs.prims[2].fctl.right_aileron_1_position_deg,
                      busInputs.prims[0].fctl.right_aileron_2_position_deg, busInputs.secs[2].right_aileron_1_position_deg,
                      busInputs.secs[0].right_aileron_2_position_deg);
  setSurfacePosition2(output.aileronRightOuterPos, busInputs.prims[1].fctl.right_aileron_1_position_deg,
                      busInputs.prims[2].fctl.right_aileron_2_position_deg);

  setSurfacePosition4(output.elevatorLeftInnerPos, busInputs.prims[2].fctl.elevator_1_position_deg,
                      busInputs.prims[0].fctl.elevator_2_position_deg, busInputs.secs[2].elevator_1_position_deg,
                      busInputs.secs[0].elevator_2_position_deg);
  setSurfacePosition4(output.elevatorLeftOuterPos, busInputs.prims[0].fctl.elevator_1_position_deg,
                      busInputs.prims[1].fctl.elevator_2_position_deg, busInputs.secs[0].elevator_1_position_deg,
                      busInputs.secs[1].elevator_2_position_deg);
  setSurfacePosition4(output.elevatorRightInnerPos, busInputs.prims[2].fctl.elevator_1_position_deg,
                      busInputs.prims[1].fctl.elevator_3_position_deg, busInputs.secs[2].elevator_1_position_deg,
                      busInputs.secs[1].elevator_3_position_deg);
  setSurfacePosition4(output.elevatorRightOuterPos, busInputs.prims[1].fctl.elevator_1_position_deg,
                      busInputs.prims[0].fctl.elevator_3_position_deg, busInputs.secs[1].elevator_1_position_deg,
                      busInputs.secs[0].elevator_3_position_deg);

  setSurfacePosition4(output.horizStabTrimPos, busInputs.prims[2].fctl.ths_position_deg, busInputs.prims[0].fctl.ths_position_deg,
                      busInputs.secs[2].ths_position_deg, busInputs.secs[0].ths_position_deg);

  setSurfacePosition4(output.rudderUpperPos, busInputs.prims[0].fctl.rudder_1_position_deg, busInputs.prims[1].fctl.rudder_1_position_deg,
                      busInputs.secs[0].rudder_1_position_deg, busInputs.secs[1].rudder_1_position_deg);
  setSurfacePosition4(output.rudderLowerPos, busInputs.prims[0].fctl.rudder_2_position_deg, busInputs.prims[2].fctl.rudder_1_position_deg,
                      busInputs.secs[0].rudder_2_position_deg, busInputs.secs[2].rudder_1_position_deg);

  setSurfacePosition2(output.rudderTrimPos, busInputs.secs[0].rudder_trim_actual_pos_deg, busInputs.secs[2].rudder_trim_actual_pos_deg);

  auto setSpoilerPosition = [&](Arinc429NumericWord& target, base_arinc_429 pos) {
    const auto posValid = isNo(pos);

    target.setFromData(pos.Data, posValid ? Arinc429SignStatus::NormalOperation : Arinc429SignStatus::NoComputedData);
  };

  setSpoilerPosition(output.spoilerLeft1Pos, busInputs.secs[2].left_spoiler_1_position_deg);
  setSpoilerPosition(output.spoilerLeft2Pos, busInputs.secs[1].left_spoiler_1_position_deg);
  setSpoilerPosition(output.spoilerLeft3Pos, busInputs.secs[0].left_spoiler_1_position_deg);
  setSpoilerPosition(output.spoilerLeft4Pos, busInputs.prims[2].fctl.left_spoiler_position_deg);
  setSpoilerPosition(output.spoilerLeft5Pos, busInputs.prims[1].fctl.left_spoiler_position_deg);
  setSpoilerPosition(output.spoilerLeft6Pos, busInputs.prims[0].fctl.left_spoiler_position_deg);
  setSpoilerPosition(output.spoilerLeft7Pos, busInputs.secs[1].left_spoiler_2_position_deg);
  setSpoilerPosition(output.spoilerLeft8Pos, busInputs.secs[2].left_spoiler_2_position_deg);

  setSpoilerPosition(output.spoilerRight1Pos, busInputs.secs[2].right_spoiler_1_position_deg);
  setSpoilerPosition(output.spoilerRight2Pos, busInputs.secs[1].right_spoiler_1_position_deg);
  setSpoilerPosition(output.spoilerRight3Pos, busInputs.secs[0].right_spoiler_1_position_deg);
  setSpoilerPosition(output.spoilerRight4Pos, busInputs.prims[2].fctl.right_spoiler_position_deg);
  setSpoilerPosition(output.spoilerRight5Pos, busInputs.prims[1].fctl.right_spoiler_position_deg);
  setSpoilerPosition(output.spoilerRight6Pos, busInputs.prims[0].fctl.right_spoiler_position_deg);
  setSpoilerPosition(output.spoilerRight7Pos, busInputs.secs[1].right_spoiler_2_position_deg);
  setSpoilerPosition(output.spoilerRight8Pos, busInputs.secs[2].right_spoiler_2_position_deg);

  output.fcdcFgDiscreteWord1.setSsm(ssm);
  output.fcdcFgDiscreteWord1.setBit(24, land2Capacity);
  output.fcdcFgDiscreteWord1.setBit(25, land3FailPassiveCapacity);
  output.fcdcFgDiscreteWord1.setBit(26, land3FailOperationalCapacity);

  output.fcdcFgDiscreteWord2.setSsm(ssm);
  output.fcdcFgDiscreteWord2.setBit(11, false);
  output.fcdcFgDiscreteWord2.setBit(12, false);
  output.fcdcFgDiscreteWord2.setBit(13, false);
  output.fcdcFgDiscreteWord2.setBit(14, false);
  output.fcdcFgDiscreteWord2.setBit(15, false);
  output.fcdcFgDiscreteWord2.setBit(24, land2Inop);
  output.fcdcFgDiscreteWord2.setBit(25, land3FailPassiveInop);
  output.fcdcFgDiscreteWord2.setBit(26, land3FailOperationalInop);

  output.fcdcFgDiscreteWord3.setSsm(ssm);  // Add FE bits here until FCDC rewrite.
  output.fcdcFgDiscreteWord3.setBit(11,
                                    bitFromValueOr(busInputs.prims[masterPrimIndex].fe.discrete_word_1, 12, false));  // SPEED SPEED SPEED
  output.fcdcFgDiscreteWord3.setBit(12, bitFromValueOr(busInputs.prims[masterPrimIndex].fe.discrete_word_1, 12, false));    // PITCH PITCH
  output.fcdcFgDiscreteWord3.setBit(13, bitFromValueOr(busInputs.prims[masterPrimIndex].fe.discrete_word_1, 12, false));    // BANK BANK
  output.fcdcFgDiscreteWord3.setBit(14, bitFromValueOr(busInputs.prims[masterPrimIndex].fg.ats_discrete_word, 14, false));  // A/THR Limited
  output.fcdcFgDiscreteWord3.setBit(15, false);
  output.fcdcFgDiscreteWord3.setBit(16, modeReversionTripleClickMtrig.read() || capabilityTripleClickMtrig.read());
  output.fcdcFgDiscreteWord3.setBit(17, btvTripleClickMtrig.read());
  output.fcdcFgDiscreteWord3.setBit(18, false);

  output.landingFctDiscreteWord.setSsm(ssm);
  output.landingFctDiscreteWord.setBit(11, rowLost);                    // ROW LOST
  output.landingFctDiscreteWord.setBit(12, ropLost);                    // ROP LOST
  output.landingFctDiscreteWord.setBit(13, btvLost);                    // BTV LOST
  output.landingFctDiscreteWord.setBit(20, ldgDistAffectedRowRopLost);  // LDG DIST AFFECTED LEADING TO ROW LOST
  output.landingFctDiscreteWord.setBit(21, ldgPerfAffectedRowRopLost);  // LDG PERF AFFECTED LEADING TO ROW LOST
  output.landingFctDiscreteWord.setBit(22, ldgDistAffectedBtvLost);     // LDG DIST AFFECTED LEADING TO BTV LOST
  output.landingFctDiscreteWord.setBit(23, ldgPerfAffectedBtvLost);     // LDG PERF AFFECTED LEADING TO BTV LOST
  output.landingFctDiscreteWord.setBit(24, ldgDistAffectedMisc);        // LDG DIST AFFECTED
  output.landingFctDiscreteWord.setBit(25, ldgPerfAffectedMisc);        // LDG PERF AFFECTED

  return output;
}

FcdcDiscreteOutputs Fcdc::getDiscreteOutputs() {
  FcdcDiscreteOutputs output = {};

  output.captRedPriorityLightOn = false;
  output.captGreenPriorityLightOn = false;
  output.foRedPriorityLightOn = false;
  output.foGreenPriorityLightOn = false;

  output.fcdcValid = monitoringHealthy;

  if (!monitoringHealthy) {
    output.btvLost = false;
    return output;
  }

  output.btvLost = btvLost;

  return output;
}

std::tuple<bool, real32_T> computeElevatorPosition(base_arinc_429 pos1,
                                                   bool computer1Engaged,
                                                   base_arinc_429 pos2,
                                                   bool computer2Engaged,
                                                   base_arinc_429 pos3,
                                                   bool computer3Engaged,
                                                   base_arinc_429 pos4,
                                                   bool computer4Engaged) {
  const auto anyEngaged = computer1Engaged || computer2Engaged || computer3Engaged || computer4Engaged;
  real32_T pos;
  bool posValid = true;

  if ((!anyEngaged || computer1Engaged) && isNo(pos1)) {
    pos = pos1.Data;
  } else if ((!anyEngaged || computer2Engaged) && isNo(pos2)) {
    pos = pos2.Data;
  } else if ((!anyEngaged || computer3Engaged) && isNo(pos3)) {
    pos = pos3.Data;
  } else if ((!anyEngaged || computer4Engaged) && isNo(pos4)) {
    pos = pos4.Data;
  } else {
    pos = 0;
    posValid = false;
  }

  return {posValid, pos};
}

void Fcdc::updateApproachCapability(double deltaTime) {
  // Calculate and set approach capacity
  // Each PRIM computes the approach capability it is able to provide. For LAND 3 Fail Op., PRIM 1 and 3 or 2 and 3 must be able to provide
  // LAND 3 Fail Op. The FCDC additionally checks for peripheral status that is not included in the PRIM computation, such as PFD, FWS,
  // FCDC Opp, etc, and the AP and A/THR engagement status.

  const auto primLand2Capability = bitFromValueOr(busInputs.prims[masterPrimIndex].fg.discrete_word_1, 27, false);

  const auto primLand3FailPassiveCapability = bitFromValueOr(busInputs.prims[masterPrimIndex].fg.discrete_word_1, 28, false);

  const auto primLand3FailOperationalCapability = (bitFromValueOr(busInputs.prims[0].fg.discrete_word_1, 29, false) &&
                                                   bitFromValueOr(busInputs.prims[1].fg.discrete_word_1, 29, false)) ||
                                                  (bitFromValueOr(busInputs.prims[0].fg.discrete_word_1, 29, false) &&
                                                   bitFromValueOr(busInputs.prims[2].fg.discrete_word_1, 29, false));

  const auto oneApEngaged = bitFromValueOr(busInputs.prims[masterPrimIndex].fg.discrete_word_1, 11, false) ||
                            bitFromValueOr(busInputs.prims[masterPrimIndex].fg.discrete_word_1, 12, false);
  const auto bothApEngaged = bitFromValueOr(busInputs.prims[masterPrimIndex].fg.discrete_word_1, 11, false) &&
                             bitFromValueOr(busInputs.prims[masterPrimIndex].fg.discrete_word_1, 12, false);
  const auto athrEngaged = bitFromValueOr(busInputs.prims[masterPrimIndex].fg.ats_discrete_word, 11, false);

  const auto landModeArmedOrEngaged = bitFromValueOr(busInputs.prims[masterPrimIndex].fg.discrete_word_1, 23, false) ||
                                      bitFromValueOr(busInputs.prims[masterPrimIndex].fg.discrete_word_2, 28, false);

  const auto fwsAudioFunctionAvailable =
      bitFromValueOr(busInputs.fwsDiscreteWord126[0], 16, false) + bitFromValueOr(busInputs.fwsDiscreteWord126[1], 16, false);
  const auto numEnginesOperative = discreteInputs.engineOperative[0] + discreteInputs.engineOperative[1] +
                                   discreteInputs.engineOperative[2] + discreteInputs.engineOperative[3];

  const bool oneEngineOnEachSide = (discreteInputs.engineOperative[0] || discreteInputs.engineOperative[1]) &&
                                   (discreteInputs.engineOperative[2] || discreteInputs.engineOperative[3]);
  bool land3FailOperationalEngineCriteria = numEnginesOperative == 4 || (numEnginesOperative == 3 && discreteInputs.apuGenConnected);

  const auto land2Capability = primLand2Capability && fwsAudioFunctionAvailable > 0 && oneEngineOnEachSide;
  const auto land3FailPassiveCapability = land2Capability && primLand3FailPassiveCapability && numEnginesOperative >= 3;
  const auto land3FailOperationalCapability = primLand3FailOperationalCapability && fwsAudioFunctionAvailable >= 2 &&
                                              discreteInputs.otherFcdcHealthy && discreteInputs.everyDcSuppliedByTr &&
                                              discreteInputs.antiskidAvailable && land3FailOperationalEngineCriteria;

  const auto memorizeLand3Capability = radioAlt < 200 && oneApEngaged && landModeArmedOrEngaged;
  const auto northRefTrue = bitFromValueOr(busInputs.prims[0].fg.discrete_word_5, 13, false);

  land3FailOperationalCapacity =
      (land3FailOperationalCapacity && memorizeLand3Capability) ||
      (land3FailOperationalCapability && bothApEngaged && athrEngaged && landModeArmedOrEngaged && !northRefTrue);
  land3FailPassiveCapacity =
      (land3FailPassiveCapacity && memorizeLand3Capability) || (land3FailPassiveCapability && oneApEngaged && athrEngaged &&
                                                                landModeArmedOrEngaged && !northRefTrue && !land3FailOperationalCapacity);
  land2Capacity = land2Capability && oneApEngaged && landModeArmedOrEngaged && !northRefTrue && !land3FailPassiveCapacity &&
                  !land3FailOperationalCapacity;

  land2Inop = !land2Capability;
  land3FailPassiveInop = !land3FailPassiveCapability;
  land3FailOperationalInop = !land3FailOperationalCapability;

  int newLandCapacity = land3FailOperationalCapacity ? 5 : land3FailPassiveCapacity ? 4 : land2Capacity ? 3 : 0;
  capabilityTripleClickMtrig.write(newLandCapacity < previousLandCapacity, deltaTime);
  previousLandCapacity = newLandCapacity;
}

void Fcdc::updateBtvRowRop(double deltaTime) {
  // Populate BTV data
  btvTripleClickMtrig.write(discreteInputs.btvExitMissed, deltaTime);

  // BTV reversion triple click
  // On ground, if BTV is active and then deactivates --> triple click
  // In flight below 700ft RA, if BTV was armed and then was disarmed --> triple click
  Arinc429DiscreteWord* lgciu1DiscreteWord2 = reinterpret_cast<Arinc429DiscreteWord*>(&busInputs.lgciuBusOutputs[0].discrete_word_2);
  Arinc429DiscreteWord* lgciu2DiscreteWord2 = reinterpret_cast<Arinc429DiscreteWord*>(&busInputs.lgciuBusOutputs[1].discrete_word_2);
  bool onGround = lgciu1DiscreteWord2->bitFromValueOr(11, false) || lgciu2DiscreteWord2->bitFromValueOr(11, false);
  bool btvActive =
      discreteInputs.autoBrakeActive && (discreteInputs.btvState == 2 || discreteInputs.btvState == 3 || discreteInputs.btvState == 4);
  bool btvArmed = !discreteInputs.autoBrakeActive && discreteInputs.btvState == 1;
  if (onGround && !btvActive && lastBtvActive) {
    btvTripleClickMtrig.write(true, deltaTime);
  } else if (!onGround && radioAlt < 700 && !btvArmed && lastBtvArmed) {
    btvTripleClickMtrig.write(true, deltaTime);
  }
  lastBtvActive = btvActive;
  lastBtvArmed = btvArmed;

  // Check PRIM and SEC availability
  int primAvailable = 0;
  int masterPrim = 0;
  int secAvailable = 0;
  int irAvailable = 0;
  int adrAvailable = 0;
  int raAvailable = 0;
  int fwsAudioFunctionAvailable = 0;

  for (int i = 0; i < 3; i++) {
    if (isNo(busInputs.prims[i].fctl.fctl_law_status_word) == true) {
      primAvailable++;
    }
    if (isNo(busInputs.secs[i].fctl_law_status_word) == true) {
      secAvailable++;
    }
    if (isNo(busInputs.irBusOutputs[i].latitude_deg) == true) {
      irAvailable++;
    }
    if (!isFw(busInputs.adrBusOutputs[i].aoa_corrected_deg) == true) {
      adrAvailable++;
    }
    if (!isFw(busInputs.raBusOutputs[i].radio_height_ft) == true) {
      raAvailable++;
    }
  }

  for (int i = 0; i < 2; i++) {
    if (bitFromValueOr(busInputs.fwsDiscreteWord126[i], 16, false)) {
      fwsAudioFunctionAvailable++;
    }
  }

  // LDG PERF AFFECTED leading to ROP/ROW LOST
  ldgPerfAffectedRowRopLost = discreteInputs.abnProcImpactingLdgPerfActive;
  ldgDistAffectedRowRopLost = discreteInputs.yellowHydraulicAvailable == false || discreteInputs.greenHydraulicAvailable == false ||
                              discreteInputs.dcEssFailed || discreteInputs.dc2Failed || discreteInputs.ac2Failed;

  // LDG PERF AFFECTED leading to BTV LOST
  Arinc429DiscreteWord* elevStatusWord =
      reinterpret_cast<Arinc429DiscreteWord*>(&busInputs.prims[masterPrimIndex].fctl.elevator_status_word);
  bool doubleElevFault = (elevStatusWord->bitFromValueOr(11, false) ? 1 : 0) + (elevStatusWord->bitFromValueOr(14, false) ? 1 : 0) +
                             (elevStatusWord->bitFromValueOr(17, false) ? 1 : 0) <
                         2;
  bool anyAileronFault = false;  // FIXME add
  Arinc429DiscreteWord* sfcc1StatusWord =
      reinterpret_cast<Arinc429DiscreteWord*>(&busInputs.sfccBusOutputs[0].slat_flap_system_status_word);
  Arinc429DiscreteWord* sfcc2StatusWord =
      reinterpret_cast<Arinc429DiscreteWord*>(&busInputs.sfccBusOutputs[1].slat_flap_system_status_word);
  bool allSlatsFault = sfcc1StatusWord->bitFromValueOr(11, false) && sfcc2StatusWord->bitFromValueOr(11, false);
  bool allFlapsFault = sfcc1StatusWord->bitFromValueOr(12, false) && sfcc2StatusWord->bitFromValueOr(12, false);
  bool slatsLocked = sfcc1StatusWord->bitFromValueOr(15, false) || sfcc2StatusWord->bitFromValueOr(15, false);
  ldgPerfAffectedBtvLost =
      ldgPerfAffectedRowRopLost || primAvailable < 3 || allSlatsFault || allFlapsFault || slatsLocked || doubleElevFault;
  ldgDistAffectedBtvLost = secAvailable < 3 || ldgDistAffectedRowRopLost || !discreteInputs.engineOperative[1] ||
                           !discreteInputs.engineOperative[2] || anyAileronFault;

  // common conditions for ROW/ROP and BTV lost
  bool commonConditions = irAvailable < 2 || adrAvailable < 2 || raAvailable < 1 || fwsAudioFunctionAvailable == 0;

  rowLost = commonConditions || ldgPerfAffectedRowRopLost || ldgDistAffectedRowRopLost || discreteInputs.oansFailed;
  ropLost = commonConditions || ldgPerfAffectedRowRopLost || ldgDistAffectedRowRopLost || discreteInputs.oansFailed ||
            discreteInputs.oansPposLost;
  btvLost =
      commonConditions || ldgPerfAffectedBtvLost || ldgDistAffectedBtvLost || discreteInputs.oansFailed || discreteInputs.oansPposLost;

  // Misc. LDG DIST/LDG PERF effects
  ldgDistAffectedMisc = discreteInputs.antiskidAvailable == false;
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

PitchLaw Fcdc::getLawStatusFromBits(bool bit1, bool bit2, bool bit3) {
  if (!bit1 && !bit2 && bit3) {
    return PitchLaw::NormalLaw;
  } else if (!bit1 && bit2 && !bit3) {
    return PitchLaw::AlternateLaw1A;
  } else if (!bit1 && bit2 && bit3) {
    return PitchLaw::AlternateLaw1B;
  } else if (bit1 && !bit2 && !bit3) {
    return PitchLaw::AlternateLaw1C;
  } else if (bit1 && !bit2 && bit3) {
    return PitchLaw::AlternateLaw2A;
  } else if (bit1 && bit2 && !bit3) {
    return PitchLaw::AlternateLaw2B;
  } else if (bit1 && bit2 && bit3) {
    return PitchLaw::DirectLaw;
  } else {
    return PitchLaw::None;
  }
}

std::tuple<bool, bool, bool, bool> Fcdc::computeAileronStatusFromComputer(base_arinc_429& word, int offset, bool defaultValue) {
  return {bitFromValueOr(word, 11 + offset, defaultValue), bitFromValueOr(word, 14 + offset, defaultValue),
          bitFromValueOr(word, 17 + offset, defaultValue), bitFromValueOr(word, 20 + offset, defaultValue)};
}

std::tuple<bool, bool, bool, bool> Fcdc::computeElevatorStatusFromComputer(base_arinc_429& word, int offset, bool defaultValue) {
  return {bitFromValueOr(word, 11 + offset, defaultValue), bitFromValueOr(word, 14 + offset, defaultValue),
          bitFromValueOr(word, 17 + offset, defaultValue), bitFromValueOr(word, 20 + offset, defaultValue)};
}

std::tuple<bool, bool, bool, bool> Fcdc::computeRudderStatusFromComputer(base_arinc_429& word, int offset, bool defaultValue) {
  return {bitFromValueOr(word, 11 + offset * 2, defaultValue), bitFromValueOr(word, 12 + offset * 2, defaultValue),
          bitFromValueOr(word, 17 + offset * 2, defaultValue), bitFromValueOr(word, 18 + offset * 2, defaultValue)};
}

std::tuple<bool, bool, bool, bool> Fcdc::computeSpoilerStatusFromPrim(base_arinc_429& word, int offset, bool defaultValue) {
  return {bitFromValueOr(word, 11 + offset * 2, defaultValue), bitFromValueOr(word, 12 + offset * 2, defaultValue),
          bitFromValueOr(word, 17 + offset * 2, defaultValue), bitFromValueOr(word, 18 + offset * 2, defaultValue)};
}

std::tuple<bool, bool, bool, bool> Fcdc::computeSpoilerStatusFromSec(base_arinc_429& word, int offset, bool defaultValue) {
  return {bitFromValueOr(word, 11 + offset, defaultValue), bitFromValueOr(word, 14 + offset, defaultValue),
          bitFromValueOr(word, 17 + offset, defaultValue), bitFromValueOr(word, 20 + offset, defaultValue)};
}

// These should also consider which computer is engaged and use that position as priority, but this is not currently implemented as there
// cannot currently be a difference between surface position feedbacks.
std::tuple<real_T, bool> Fcdc::computeSurfacePosition(base_arinc_429 pos1, base_arinc_429 pos2, base_arinc_429 pos3, base_arinc_429 pos4) {
  bool positionInfoValid = true;
  real_T surfacePosition;
  if (isNo(pos1)) {
    surfacePosition = pos1.Data;
  } else if (isNo(pos2)) {
    surfacePosition = pos2.Data;
  } else if (isNo(pos3)) {
    surfacePosition = pos3.Data;
  } else if (isNo(pos4)) {
    surfacePosition = pos4.Data;
  } else {
    surfacePosition = 0;
    positionInfoValid = false;
  }

  return {surfacePosition, positionInfoValid};
}

std::tuple<real_T, bool> Fcdc::computeSurfacePosition(base_arinc_429 pos1, base_arinc_429 pos2) {
  bool positionInfoValid = true;
  real_T surfacePosition;
  if (isNo(pos1)) {
    surfacePosition = pos1.Data;
  } else if (isNo(pos2)) {
    surfacePosition = pos2.Data;
  } else {
    surfacePosition = 0;
    positionInfoValid = false;
  }

  return {surfacePosition, positionInfoValid};
}
