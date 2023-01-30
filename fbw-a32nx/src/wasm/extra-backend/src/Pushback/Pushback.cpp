// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <iostream>

#include "logging.h"
#include "Units.h"
#include "MsfsHandler.h"
#include "Pushback.h"
#include "AircraftVariable.h"
#include "NamedVariable.h"

static constexpr double SPEED_RATIO = 18.0;
static constexpr double TURN_SPEED_RATIO = 0.16;

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
//
// No variable is written automatically.
///

bool Pushback::initialize() {
  dataManager = &msfsHandler->getDataManager();

  // LVARs
  pushbackSystemEnabled = dataManager->make_named_var("PUSHBACK_SYSTEM_ENABLED", UNITS.Bool, true);
  parkingBrakeEngaged = dataManager->make_named_var("PARK_BRAKE_LEVER_POS");
  tugCommandedSpeedFactor = dataManager->make_named_var("PUSHBACK_SPD_FACTOR");
  tugCommandedHeadingFactor = dataManager->make_named_var("PUSHBACK_HDG_FACTOR");
  // debug purposes
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
  std::vector<SimObjectBase::DataDefinition> pushBackDataDef = {
    {"Pushback Wait",                0, UNITS.Bool},
    {"VELOCITY BODY Z",              0, UNITS.FeetSec},
    {"ROTATION VELOCITY BODY Y",     0, UNITS.FeetSec},
    {"ROTATION ACCELERATION BODY X", 0, UNITS.RadSecSquared}
  };
  pushbackData = dataManager
    ->make_datadefinition_var<PushbackData>("PUSHBACK DATA", pushBackDataDef);

  // Events
  // Normally "KEY_..." events can't be treated like normal events, but in this case there is no
  // normal event (e.g. TUG_HEADING) that we can use. So we use the "KEY_..." events instead and
  // surprisingly the sim accepts them. This seems to be an inconsistency in the sim.
  tugHeadingEvent = dataManager->make_event("KEY_TUG_HEADING");
  tugSpeedEvent = dataManager->make_event("KEY_TUG_SPEED");

  isInitialized = true;
  LOG_INFO("Pushback initialized");
  return true;
}

bool Pushback::preUpdate([[maybe_unused]]sGaugeDrawData* pData) {
  // empty
  return true;
}

bool Pushback::update(sGaugeDrawData* pData) {
  if (!isInitialized) {
    std::cerr << "Pushback::update() - not initialized" << std::endl;
    return false;
  }

  if (!msfsHandler->getA32NxIsReady()) return true;

  // Check if the pushback system is enabled and conditions are met
  if (!pushbackSystemEnabled->getAsBool()
      || !pushbackAttached->getAsBool()
      || !simOnGround->getAsBool()) {
    return true;
  }

  const FLOAT64 timeStamp = msfsHandler->getTimeStamp();
  const UINT64 tickCounter = msfsHandler->getTickCounter();

  // read all data from sim - could be done inline but better readability this way
  parkingBrakeEngaged->updateFromSim(timeStamp, tickCounter);
  aircraftHeading->updateFromSim(timeStamp, tickCounter);
  tugCommandedSpeedFactor->updateFromSim(timeStamp, tickCounter);
  tugCommandedHeadingFactor->updateFromSim(timeStamp, tickCounter);
  windVelBodyZ->updateFromSim(timeStamp, tickCounter);

  const double parkBrakeSpdFactor = parkingBrakeEngaged->getAsBool() ? (SPEED_RATIO / 10) : SPEED_RATIO;
  const FLOAT64 tugCmdSpd = tugCommandedSpeedFactor->get() * parkBrakeSpdFactor;

  const FLOAT64 inertiaSpeed = inertialDampener.updateSpeed(tugCmdSpd);

  const double parkingBrakeHdgFactor =
    parkingBrakeEngaged->getAsBool() ? (TURN_SPEED_RATIO / 10) : TURN_SPEED_RATIO;
  const FLOAT64 computedRotationVelocity = sgn<FLOAT64>(tugCmdSpd)
                                           * tugCommandedHeadingFactor->get()
                                           * parkingBrakeHdgFactor;

  // As we might use the elevator for taxiing we compensate for wind to avoid
  // the aircraft lifting any gears.
  const FLOAT64 windCounterRotAccel = windVelBodyZ->get() / 2000.0;
  FLOAT64 movementCounterRotAccel = windCounterRotAccel;
  if (inertiaSpeed > 0) { movementCounterRotAccel -= 0.5; }
  else if (inertiaSpeed < 0) { movementCounterRotAccel += 1.0; }
  else { movementCounterRotAccel = 0.0; }

  // K:KEY_TUG_HEADING expects an unsigned integer scaling 360° to 0 to 2^32-1 (0xffffffff / 360)
  FLOAT64 aircraftHeadingDeg = aircraftHeading->get() * (180.0 / PI);
  const FLOAT64 computedHdg = angleAdd(aircraftHeadingDeg,
                                       -90 * tugCommandedHeadingFactor->get());

  // TUG_HEADING units are a 32-bit integer (0 to 4294967295) which represent 0 to 360 degrees.
  // To set a 45-degree angle, for example, set the value to 4294967295 / 8.
  // https://docs.flightsimulator.com/html/Programming_Tools/Event_IDs/Aircraft_Misc_Events.htm#TUG_HEADING
  constexpr DWORD headingToInt32 = 0xffffffff / 360;
  const DWORD convertedComputedHeading = static_cast<DWORD>(computedHdg) * headingToInt32;

  // send as LVARs for debugging in the flyPad
  updateDelta->setAndWriteToSim(pData->dt); // debug value
  tugInertiaSpeed->setAndWriteToSim(inertiaSpeed); // debug value
  tugCommandedSpeed->setAndWriteToSim(tugCmdSpd); // debug value
  rotXOut->setAndWriteToSim(movementCounterRotAccel); // debug value
  tugCommandedHeading->setAndWriteToSim(computedHdg); // debug value

  // send K:KEY_TUG_HEADING event
  tugHeadingEvent->trigger_ex1(convertedComputedHeading, 0, 0, 0, 0);

  // K:KEY_TUG_SPEED - seems to actually do nothing
  //  tugSpeedEvent->trigger_ex1(static_cast<DWORD>(inertiaSpeed));

  // Update sim data
  pushbackData->data().pushbackWait = inertiaSpeed == 0 ? 1 : 0;
  pushbackData->data().velBodyZ = inertiaSpeed;
  pushbackData->data().rotVelBodyY = computedRotationVelocity;
  pushbackData->data().rotAccelBodyX = movementCounterRotAccel;
  pushbackData->writeDataToSim();

  return true;
}

bool Pushback::postUpdate([[maybe_unused]] sGaugeDrawData* pData) {
  //  empty
  return true;
}

bool Pushback::shutdown() {
  isInitialized = false;
  std::cout << "Pushback::shutdown()" << std::endl;
  return true;
}
