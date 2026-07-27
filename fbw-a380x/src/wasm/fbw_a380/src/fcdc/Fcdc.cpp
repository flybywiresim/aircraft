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
    allPrimsDead = true;
    for (int i = 0; i < 3; i++) {
      if (discreteInputs.primHealthy[i]) {
        allPrimsDead = false;
        masterPrimIndex = i;
        break;
      }
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
    output.fcdcFgDiscreteWord1.setSsm(Arinc429SignStatus::FailureWarning);
    output.fcdcFgDiscreteWord2.setSsm(Arinc429SignStatus::FailureWarning);
    output.fcdcFgDiscreteWord3.setSsm(Arinc429SignStatus::FailureWarning);
    return output;
  }

  // Phase 1 of refactoring: Populate FCDC discrete words as per a32nx spec, disregarding the obvious differences.
  // Target: Should behave unsuspiciously in normal ops
  Arinc429SignStatus ssm = Arinc429SignStatus::NormalOperation;

  LateralLaw systemLateralLaw =
      allPrimsDead ? LateralLaw::DirectLaw
                   : getLateralLawStatusFromBits(bitFromValue(busInputs.prims[masterPrimIndex].fctl.fctl_law_status_word, 19),
                                                 bitFromValue(busInputs.prims[masterPrimIndex].fctl.fctl_law_status_word, 20));

  PitchLaw systemPitchLaw = allPrimsDead
                                ? PitchLaw::DirectLaw
                                : getPitchLawStatusFromBits(bitFromValue(busInputs.prims[masterPrimIndex].fctl.fctl_law_status_word, 16),
                                                            bitFromValue(busInputs.prims[masterPrimIndex].fctl.fctl_law_status_word, 17),
                                                            bitFromValue(busInputs.prims[masterPrimIndex].fctl.fctl_law_status_word, 18));

  output.efcsStatus1.setSsm(ssm);
  output.efcsStatus1.setBit(11, systemPitchLaw == PitchLaw::NormalLaw);
  output.efcsStatus1.setBit(12, systemPitchLaw == PitchLaw::AlternateLaw1A || systemPitchLaw == PitchLaw::AlternateLaw1B ||
                                    systemPitchLaw == PitchLaw::AlternateLaw1C);
  output.efcsStatus1.setBit(13, systemPitchLaw == PitchLaw::AlternateLaw2);
  output.efcsStatus1.setBit(14, systemPitchLaw == PitchLaw::AlternateLaw1A);
  output.efcsStatus1.setBit(15, systemPitchLaw == PitchLaw::DirectLaw);
  output.efcsStatus1.setBit(16, systemLateralLaw == LateralLaw::NormalLaw);
  output.efcsStatus1.setBit(17, systemLateralLaw == LateralLaw::DirectLaw);
  output.efcsStatus3.setBit(19, allPrimsDead);
  output.efcsStatus3.setBit(20, allPrimsDead);
  output.efcsStatus3.setBit(21, allPrimsDead);
  output.efcsStatus3.setBit(22, allPrimsDead);
  output.efcsStatus3.setBit(23, allPrimsDead);
  output.efcsStatus3.setBit(24, allPrimsDead);
  output.efcsStatus3.setBit(25, allPrimsDead);
  output.efcsStatus3.setBit(26, allPrimsDead);
  output.efcsStatus3.setBit(29, allPrimsDead);

  output.efcsStatus2.setSsm(ssm);
  output.efcsStatus2.setBit(11, !bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.aileron_status_word, 11, false));
  output.efcsStatus2.setBit(12, !bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.aileron_status_word, 11, false));
  output.efcsStatus2.setBit(13, !bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.aileron_status_word, 14, false));
  output.efcsStatus2.setBit(14, !bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.aileron_status_word, 14, false));
  output.efcsStatus2.setBit(15, !bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.elevator_status_word, 11, false));
  output.efcsStatus2.setBit(16, !bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.elevator_status_word, 11, false));
  output.efcsStatus2.setBit(17, !bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.elevator_status_word, 14, false));
  output.efcsStatus2.setBit(18, !bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.elevator_status_word, 14, false));

  output.efcsStatus3.setSsm(ssm);
  output.efcsStatus3.setBit(11, bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.aileron_status_word, 11, false));
  output.efcsStatus3.setBit(12, bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.aileron_status_word, 11, false));
  output.efcsStatus3.setBit(13, bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.aileron_status_word, 14, false));
  output.efcsStatus3.setBit(14, bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.aileron_status_word, 14, false));
  output.efcsStatus3.setBit(15, bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.elevator_status_word, 11, false));
  output.efcsStatus3.setBit(16, bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.elevator_status_word, 11, false));
  output.efcsStatus3.setBit(17, bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.elevator_status_word, 14, false));
  output.efcsStatus3.setBit(18, bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.elevator_status_word, 14, false));
  output.efcsStatus3.setBit(21, bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.spoiler_status_word, 11, false));
  output.efcsStatus3.setBit(22, bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.spoiler_status_word, 11, false));
  output.efcsStatus3.setBit(23, bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.spoiler_status_word, 11, false));
  output.efcsStatus3.setBit(24, bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.spoiler_status_word, 11, false));
  output.efcsStatus3.setBit(25, bitFromValueOr(busInputs.prims[masterPrimIndex].fctl.spoiler_status_word, 11, false));

  // FIXME inaccurate atm, improve
  output.efcsStatus4.setSsm(ssm);
  output.efcsStatus4.setBit(11, valueOr(busInputs.prims[masterPrimIndex].fctl.left_spoiler_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(12, valueOr(busInputs.prims[masterPrimIndex].fctl.right_spoiler_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(13, valueOr(busInputs.prims[masterPrimIndex].fctl.left_spoiler_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(14, valueOr(busInputs.prims[masterPrimIndex].fctl.right_spoiler_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(15, valueOr(busInputs.prims[masterPrimIndex].fctl.left_spoiler_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(16, valueOr(busInputs.prims[masterPrimIndex].fctl.right_spoiler_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(17, valueOr(busInputs.prims[masterPrimIndex].fctl.left_spoiler_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(18, valueOr(busInputs.prims[masterPrimIndex].fctl.right_spoiler_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(19, valueOr(busInputs.prims[masterPrimIndex].fctl.left_spoiler_position_deg, 0) < -2.5);
  output.efcsStatus4.setBit(20, valueOr(busInputs.prims[masterPrimIndex].fctl.right_spoiler_position_deg, 0) < -2.5);
  bool spoilerValid = isNo(busInputs.prims[masterPrimIndex].fctl.left_spoiler_position_deg) &&
                      isNo(busInputs.prims[masterPrimIndex].fctl.right_spoiler_position_deg);
  output.efcsStatus4.setBit(21, spoilerValid);
  output.efcsStatus4.setBit(22, spoilerValid);
  output.efcsStatus4.setBit(23, spoilerValid);
  output.efcsStatus4.setBit(24, spoilerValid);
  output.efcsStatus4.setBit(25, spoilerValid);
  output.efcsStatus4.setBit(26, valueOr(busInputs.prims[masterPrimIndex].fctl.left_spoiler_position_deg, 0) < -5);
  output.efcsStatus4.setBit(27, discreteInputs.spoilersArmed);
  output.efcsStatus4.setBit(28, analogInputs.spoilersLeverPos > 0.9);

  output.efcsStatus5.setData(0);

  output.efcsStatus5.setSsm(ssm);
  bool spoilersRetracted = valueOr(busInputs.prims[masterPrimIndex].fctl.left_spoiler_position_deg, 0.0f) >= -2.5f &&
                           valueOr(busInputs.prims[masterPrimIndex].fctl.right_spoiler_position_deg, 0.0f) >= -2.5f;
  output.efcsStatus5.setBit(26, (analogInputs.spoilersLeverPos > 0.05) && spoilersRetracted);

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

  output.fcdcFgDiscreteWord3.setSsm(ssm);
  output.fcdcFgDiscreteWord3.setBit(11, false);
  output.fcdcFgDiscreteWord3.setBit(12, false);
  output.fcdcFgDiscreteWord3.setBit(13, false);
  output.fcdcFgDiscreteWord3.setBit(14, false);
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
  const auto northRefTrue = bitFromValueOr(busInputs.prims[0].fg.discrete_word_5, 13, false);

  const auto land2Capability = primLand2Capability && fwsAudioFunctionAvailable > 0;
  const auto land3FailPassiveCapability = land2Capability && primLand3FailPassiveCapability;
  const auto land3FailOperationalCapability = primLand3FailOperationalCapability && fwsAudioFunctionAvailable >= 2 &&
                                              discreteInputs.otherFcdcHealthy && discreteInputs.everyDcSuppliedByTr &&
                                              discreteInputs.antiskidAvailable;

  const auto memorizeLand3Capability = radioAlt < 200 && oneApEngaged && landModeArmedOrEngaged;

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

PitchLaw Fcdc::getPitchLawStatusFromBits(bool bit1, bool bit2, bool bit3) {
  if (!bit1 && !bit2 && bit3) {
    return PitchLaw::NormalLaw;
  } else if (!bit1 && bit2 && !bit3) {
    return PitchLaw::AlternateLaw1A;
  } else if (!bit1 && bit2 && bit3) {
    return PitchLaw::AlternateLaw1B;
  } else if (bit1 && !bit2 && !bit3) {
    return PitchLaw::AlternateLaw1C;
  } else if (bit1 && !bit2 && bit3) {
    return PitchLaw::AlternateLaw2;
  } else if (bit1 && bit2 && !bit3) {
    return PitchLaw::DirectLaw;
  } else {
    return PitchLaw::None;
  }
}

LateralLaw Fcdc::getLateralLawStatusFromBits(bool bit1, bool bit2) {
  if (bit1) {
    return LateralLaw::NormalLaw;
  } else if (bit2) {
    return LateralLaw::DirectLaw;
  } else {
    return LateralLaw::None;
  }
}
