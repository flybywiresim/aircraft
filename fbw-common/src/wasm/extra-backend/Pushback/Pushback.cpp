// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <iostream>

#include "AircraftVariable.h"
#include "MsfsHandler.h"
#include "NamedVariable.h"
#include "Pushback.h"
#include "SimUnits.h"
#include "UpdateMode.h"
#include "logging.h"
#include "math_utils.hpp"

///
// DataManager Howto Note:
// =======================

// The Pushback module uses the DataManager to get and set variables.
// Looking at the make_xxx_var functions, you can see that they are updated
// with different update cycles.
//
// Some variables are read from the sim at every tick:
// - A32NX_PUSHBACK_SYSTEM_ENABLED
// - Pushback Attached
// - SIM ON GROUND
//
// The rest are read on demand after the state of the above variables have been checked.
// No variable is written automatically.
//
// This makes sure variables are only read or written to when really needed. And as pushback will
// be dormant most of the time, this is saving a lot of unnecessary reads/writes.
///

bool Pushback::initialize() {
  dataManager = &msfsHandler.getDataManager();

  // LVARs
  pushbackSystemEnabled = dataManager->make_named_var("PUSHBACK_SYSTEM_ENABLED", UNITS.Bool, UpdateMode::AUTO_READ);
  parkingBrakeEngaged = dataManager->make_named_var("PARK_BRAKE_LEVER_POS");
  tugCommandedSpeedFactor = dataManager->make_named_var("PUSHBACK_SPD_FACTOR");
  tugCommandedHeadingFactor = dataManager->make_named_var("PUSHBACK_HDG_FACTOR");
  // debug purposes
  pushbackDebug = dataManager->make_named_var("PUSHBACK_DEBUG", UNITS.Bool, UpdateMode::AUTO_READ);
  tugCommandedSpeed = dataManager->make_named_var("PUSHBACK_SPD");
  tugCommandedHeading = dataManager->make_named_var("PUSHBACK_HDG");
  tugInertiaSpeed = dataManager->make_named_var("PUSHBACK_INERTIA_SPD");
  updateDelta = dataManager->make_named_var("PUSHBACK_UPDT_DELTA");
  rotXOut = dataManager->make_named_var("PUSHBACK_R_X_OUT");

  // Simvars
  pushbackAttached = dataManager->make_simple_aircraft_var("Pushback Attached", UNITS.Bool, true);
  simOnGround = dataManager->make_simple_aircraft_var("SIM ON GROUND", UNITS.Number, true);
  aircraftHeading = dataManager->make_simple_aircraft_var("PLANE HEADING DEGREES TRUE", UNITS.Rad);
  windVelBodyZ = dataManager->make_simple_aircraft_var("RELATIVE WIND VELOCITY BODY Z");

  // Data definitions for PushbackDataID
  std::vector<DataDefinition> pushBackDataDef = {{"Pushback Wait", 0, UNITS.Bool},
                                                 {"VELOCITY BODY Z", 0, UNITS.FeetSec},
                                                 {"ROTATION VELOCITY BODY Y", 0, UNITS.FeetSec},
                                                 {"ROTATION ACCELERATION BODY X", 0, UNITS.RadSecSquared}};
  pushbackData = dataManager->make_datadefinition_var<PushbackData>("PUSHBACK DATA", pushBackDataDef);

  // Events
  // Normally "KEY_..." events can't be treated like normal events, but in this case there is no
  // normal event (e.g. TUG_HEADING) that we can use. So we use the "KEY_..." events instead and
  // surprisingly the sim accepts them. This seems to be an inconsistency in the sim.
  tugHeadingEvent = dataManager->make_sim_event("KEY_TUG_HEADING", NOTIFICATION_GROUP_1);
  tugSpeedEvent = dataManager->make_sim_event("KEY_TUG_SPEED", NOTIFICATION_GROUP_1);

  _isInitialized = true;
  LOG_INFO("Pushback initialized");
  return true;
}

bool Pushback::preUpdate([[maybe_unused]] sGaugeDrawData* pData) {
  // empty
  return true;
}

bool Pushback::update(sGaugeDrawData* pData) {
  if (!_isInitialized) {
    std::cerr << "Pushback::update() - not initialized" << std::endl;
    return false;
  }

  // Check if the pushback system is enabled and conditions are met
  if (!msfsHandler.getAircraftIsReadyVar() || !pushbackSystemEnabled->getAsBool() || !pushbackAttached->getAsBool() ||
      !simOnGround->getAsBool()) {
    return true;
  }

  //  profiler.start();

  const FLOAT64 timeStamp = msfsHandler.getTimeStamp();
  const UINT64 tickCounter = msfsHandler.getTickCounter();

  // read all data from sim - could be done inline but better readability this way
  tugCommandedSpeedFactor->updateFromSim(timeStamp, tickCounter);
  tugCommandedHeadingFactor->updateFromSim(timeStamp, tickCounter);
  parkingBrakeEngaged->updateFromSim(timeStamp, tickCounter);
  aircraftHeading->updateFromSim(timeStamp, tickCounter);
  windVelBodyZ->updateFromSim(timeStamp, tickCounter);

  const double speedFactor = parkingBrakeEngaged->getAsBool() ? (getSpeedFactor() / getParkBrakeFactor()) : getSpeedFactor();
  const FLOAT64 tugCmdSpd = tugCommandedSpeedFactor->get() * speedFactor;
  const FLOAT64 inertiaSpeed = inertialDampener.updateSpeed(tugCmdSpd);
  const FLOAT64 movementCounterRotAccel = calculateCounterRotAccel(inertiaSpeed, windVelBodyZ);

  const double turnSpeedHdgFactor = parkingBrakeEngaged->getAsBool() ? (getTurnSpeedFactor() / getParkBrakeFactor()) : getTurnSpeedFactor();
  const FLOAT64 computedRotationVelocity = tugCommandedSpeedFactor->get() * tugCommandedHeadingFactor->get() * turnSpeedHdgFactor;
  const FLOAT64 aircraftHeadingDeg = aircraftHeading->get() * (180.0 / PI);
  const FLOAT64 computedHdg = helper::Math::angleAdd(aircraftHeadingDeg, -90 * tugCommandedHeadingFactor->get());

  // K:KEY_TUG_HEADING expects an unsigned integer scaling 360° to 0 to 2^32-1 (0xffffffff / 360)
  // https://docs.flightsimulator.com/html/Programming_Tools/Event_IDs/Aircraft_Misc_Events.htm#TUG_HEADING
  constexpr DWORD headingToInt32 = 0xffffffff / 360;
  const DWORD convertedComputedHeading = static_cast<DWORD>(computedHdg) * headingToInt32;

  // send as LVARs for debugging in the flyPad
  if (pushbackDebug->getAsBool()) {
    updateDelta->setAndWriteToSim(pData->dt);            // debug value
    tugInertiaSpeed->setAndWriteToSim(inertiaSpeed);     // debug value
    tugCommandedSpeed->setAndWriteToSim(tugCmdSpd);      // debug value
    rotXOut->setAndWriteToSim(movementCounterRotAccel);  // debug value
    tugCommandedHeading->setAndWriteToSim(computedHdg);  // debug value
  }
  // send K:KEY_TUG_HEADING event
  tugHeadingEvent->trigger_ex1(convertedComputedHeading, 0, 0, 0, 0);

  // K:KEY_TUG_SPEED - seems to actually do nothing
  //  tugSpeedEvent->trigger_ex1(static_cast<DWORD>(inertiaSpeed));

  // Update sim data
  pushbackData->data().pushbackWait = helper::Math::almostEqual(inertiaSpeed, 0.0) ? 1 : 0;
  pushbackData->data().velBodyZ = inertiaSpeed;
  pushbackData->data().rotVelBodyY = computedRotationVelocity;
  pushbackData->data().rotAccelBodyX = movementCounterRotAccel;
  pushbackData->writeDataToSim();

  //  profiler.stop();
  //  profiler.print();

  return true;
}

/**
 * As we might use the elevator for taxiing we compensate for wind to avoid
 * the aircraft lifting any gears.
 *
 * This contains hard coded values which are based on testing in the sim.
 *
 * @param inertiaSpeed the current inertia speed
 * @return the counter rotation acceleration
 */

bool Pushback::postUpdate([[maybe_unused]] sGaugeDrawData* pData) {
  //  empty
  return true;
}

bool Pushback::shutdown() {
  _isInitialized = false;
  std::cout << "Pushback::shutdown()" << std::endl;
  return true;
}
