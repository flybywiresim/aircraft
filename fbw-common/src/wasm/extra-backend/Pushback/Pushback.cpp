// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <iostream>

#include "AircraftVariable.h"
#include "MsfsHandler.h"
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
// It also uses DataDefinition to read and write multiple variables at once.
//
// The PushbackBaseInfo struct is used to read multiple variables at once every visual frame using
// the periodic data request feature of the DataDefinition.
//
// The rest are read on demand after the state of the above variables have been checked.
// No variable is written automatically.
//
// This makes sure variables are only read or written to when really needed. And as pushback will
// be dormant most of the time, this is saving a lot of unnecessary reads/writes.
///

bool Pushback::initialize() {
  dataManager = &msfsHandler.getDataManager();

  // LVARs - will be updated every tick if the pushback system is enabled and the tug connected
  tugCommandedSpeedFactor   = dataManager->make_named_var("PUSHBACK_SPD_FACTOR");
  tugCommandedHeadingFactor = dataManager->make_named_var("PUSHBACK_HDG_FACTOR");

  // Aircraft configuration
  //  update frequency can be lower as this is only used for tuning and therefore not critical
  //  (e.g. 0.5 Hz or every 30 ticks is enough)
  aircraftParkingBrakeFactor =
      dataManager->make_named_var("PUSHBACK_AIRCRAFT_PARKBRAKE_FACTOR", UNITS.Number, UpdateMode::NO_AUTO_UPDATE, 0.5, 30.0);
  aircraftSpeedFactor = dataManager->make_named_var("PUSHBACK_AIRCRAFT_SPEED_FACTOR", UNITS.Number, UpdateMode::NO_AUTO_UPDATE, 0.5, 30.0);
  aircraftTurnSpeedFactor =
      dataManager->make_named_var("PUSHBACK_AIRCRAFT_TURN_SPEED_FACTOR", UNITS.Number, UpdateMode::NO_AUTO_UPDATE, 0.5, 30.0);
  aircraftParkingBrakeFactor->setAndWriteToSim(this->getParkBrakeFactor());
  aircraftSpeedFactor->setAndWriteToSim(this->getSpeedFactor());
  aircraftTurnSpeedFactor->setAndWriteToSim(this->getTurnSpeedFactor());

  // Pushback Base Data
  //  will be updated every visual frame
  DataDefinitionVector pushbackBaseDataDef = {
      {"L:A32NX_PUSHBACK_SYSTEM_ENABLED", 0, UNITS.Bool   },
      {"L:A32NX_PARK_BRAKE_LEVER_POS",    0, UNITS.Bool   },
      {"PUSHBACK ATTACHED",               0, UNITS.Bool   },
      {"PLANE HEADING DEGREES TRUE",      0, UNITS.degrees},
      {"RELATIVE WIND VELOCITY BODY Z",   0, UNITS.FeetSec}
  };
  pushbackBaseInfoPtr = dataManager->make_datadefinition_var<PushbackBaseInfo>("PUSHBACK BASE DATA", pushbackBaseDataDef);
  if (pushbackBaseInfoPtr == nullptr) {
    LOG_ERROR("Failed to create PushbackBaseInfo data definition");
    return false;
  }
  pushbackBaseInfoPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME);

  // Data definitions for PushbackDataID
  //  Will only be written to sim if the pushback system is enabled and the tug connected
  DataDefinitionVector pushBackDataDef = {
      {"PUSHBACK WAIT",                0, UNITS.Bool          },
      {"VELOCITY BODY X",              0, UNITS.FeetSec       },
      {"VELOCITY BODY Y",              0, UNITS.FeetSec       },
      {"VELOCITY BODY Z",              0, UNITS.FeetSec       },
      {"ROTATION VELOCITY BODY X",     0, UNITS.FeetSec       },
      {"ROTATION VELOCITY BODY Y",     0, UNITS.FeetSec       },
      {"ROTATION VELOCITY BODY Z",     0, UNITS.FeetSec       },
      {"ROTATION ACCELERATION BODY X", 0, UNITS.FeetSecSquared},
      {"ROTATION ACCELERATION BODY Y", 0, UNITS.FeetSecSquared},
      {"ROTATION ACCELERATION BODY Z", 0, UNITS.FeetSecSquared}
  };
  pushbackDataPtr = dataManager->make_datadefinition_var<PushbackData>("PUSHBACK DATA", pushBackDataDef);
  if (pushbackDataPtr == nullptr) {
    LOG_ERROR("Failed to create PushbackData data definition");
    return false;
  }

  // Events
  // Normally "KEY_..." events can't be treated like normal events, but in this case there is no
  // normal event (e.g., TUG_HEADING) that we can use. So we use the "KEY_..." events instead and
  // surprisingly, the sim accepts them. This seems to be an inconsistency in the sim.
  tugHeadingEvent = dataManager->make_sim_event("KEY_TUG_HEADING", NOTIFICATION_GROUP_1);
  tugSpeedEvent   = dataManager->make_sim_event("KEY_TUG_SPEED", NOTIFICATION_GROUP_1);

  // debug purposes
  pushbackDebug                             = dataManager->make_named_var("PUSHBACK_DEBUG", UNITS.Bool, UpdateMode::AUTO_READ);
  DataDefinitionVector pushbackDebugDataDef = {
      {"L:A32NX_PUSHBACK_UPDT_DELTA",  0, UNITS.Number        },
      {"L:A32NX_PUSHBACK_SPD",         0, UNITS.FeetSec       },
      {"L:A32NX_PUSHBACK_HDG",         0, UNITS.degrees       },
      {"L:A32NX_PUSHBACK_INERTIA_SPD", 0, UNITS.FeetSec       },
      {"L:A32NX_PUSHBACK_R_X_OUT",     0, UNITS.FeetSecSquared}
  };
  pushbackDebugPtr = dataManager->make_datadefinition_var<PushbackDebug>("PUSHBACK DEBUG DATA", pushbackDebugDataDef);
  if (pushbackDebugPtr == nullptr) {
    LOG_ERROR("Failed to create PushbackDebug data definition");
    return false;
  }

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
    LOG_ERROR("Pushback::update() - not initialized");
    return false;
  }

  // Check if the pushback system is enabled and conditions are met
  if (!msfsHandler.getAircraftIsReadyVar() || !pushbackBaseInfoPtr->data().pushbackSystemEnabled ||
      !pushbackBaseInfoPtr->data().pushbackAttached || !msfsHandler.getSimOnGround()) {
    return true;
  }

  //  profiler.start();

  const FLOAT64 timeStamp   = msfsHandler.getTimeStamp();
  const UINT64  tickCounter = msfsHandler.getTickCounter();

  // pushbackBaseInfoPtr is updated at every tick, so we can simply use it here
  const bool parkingBrakeEngaged = static_cast<bool>(pushbackBaseInfoPtr->data().parkingBrakeEngaged);

  // read all data from sim - could be done inline but better readability this way
  tugCommandedSpeedFactor->updateFromSim(timeStamp, tickCounter);
  tugCommandedHeadingFactor->updateFromSim(timeStamp, tickCounter);
  aircraftParkingBrakeFactor->updateFromSim(timeStamp, tickCounter);
  aircraftSpeedFactor->updateFromSim(timeStamp, tickCounter);
  aircraftTurnSpeedFactor->updateFromSim(timeStamp, tickCounter);

  // Based on an aircraft specific speed factor and the user input (0.0-1.0),
  // the inertia speed (current actual speed) is calculated in ft/sec.
  const double speedFactor =
      parkingBrakeEngaged ? (aircraftSpeedFactor->get() / aircraftParkingBrakeFactor->get()) : aircraftSpeedFactor->get();
  const FLOAT64 tugCmdSpd    = tugCommandedSpeedFactor->get() * speedFactor;
  const FLOAT64 inertiaSpeed = speedDampener.updateTargetValue(tugCmdSpd);

  // Based on an aircraft-specific turn speed factor and the user input (0.0-1.0),
  // the rotation velocity is calculated in ft/sec.
  const double turnSpeedHdgFactor =
      parkingBrakeEngaged ? (aircraftTurnSpeedFactor->get() / aircraftParkingBrakeFactor->get()) : aircraftTurnSpeedFactor->get();
  const FLOAT64 computedRotationVelocity =
      turnDampener.updateTargetValue((inertiaSpeed / aircraftSpeedFactor->get()) * tugCommandedHeadingFactor->get() * turnSpeedHdgFactor);

  // The heading of the tug is calculated based on the aircraft heading and the user input (0.0-1.0).
  const FLOAT64 computedTugHdg =
      helper::Math::angleAdd(pushbackBaseInfoPtr->data().aircraftHeading, tugCommandedHeadingFactor->get() * -90);
  // K:KEY_TUG_HEADING expects an unsigned integer scaling 360° to 0 to 2^32-1 (0xffffffff / 360)
  // https://docs.flightsimulator.com/html/Programming_Tools/Event_IDs/Aircraft_Misc_Events.htm#TUG_HEADING
  const auto convertedComputedTugHeading = static_cast<uint32_t>(computedTugHdg * (UINT32_MAX / 360));

  // send K:KEY_TUG_HEADING event
  tugHeadingEvent->trigger(convertedComputedTugHeading);

  // movement of the aircraft introduces a rotation around the x-axis, which is compensated here
  // The sim seems to add this rotation and even setting rotation velocity to 0 doesn't stop it.
  // (I hate to have to do this - I hope to find a better solution in the future)
  FLOAT64 counterRotationAcceleration = 0.0;
  if (inertiaSpeed > 0.0) {
    counterRotationAcceleration = -1.0;
  } else if (inertiaSpeed < 0.0) {
    counterRotationAcceleration = +2.0;
  }

  // Update sim data
  // we update all positional velocity and acceleration data to try to keep the aircraft stable.
  // The sim will update these values based on physics like wind, ground friction, weights, inertia, etc.
  // Therefore, we need to add the "counter rotation acceleration" to the "rotation acceleration"
  // on the pitch axis to keep the aircraft stable.
  pushbackDataPtr->data().pushbackWait  = helper::Math::almostEqual(inertiaSpeed, 0.0) ? 1 : 0;
  pushbackDataPtr->data().velBodyX      = 0;
  pushbackDataPtr->data().velBodyY      = 0;
  pushbackDataPtr->data().velBodyZ      = inertiaSpeed;
  pushbackDataPtr->data().rotVelBodyX   = 0;
  pushbackDataPtr->data().rotVelBodyY   = computedRotationVelocity;
  pushbackDataPtr->data().rotVelBodyZ   = 0;
  pushbackDataPtr->data().rotAccelBodyX = counterRotationAcceleration;
  pushbackDataPtr->data().rotAccelBodyY = 0;
  pushbackDataPtr->data().rotAccelBodyZ = 0;
  pushbackDataPtr->writeDataToSim();

  // send as LVARs for debugging in the flyPad
  if (pushbackDebug->getAsBool()) {
    pushbackDebugPtr->data().updateDelta         = pData->dt;
    pushbackDebugPtr->data().tugCommandedSpeed   = tugCmdSpd;
    pushbackDebugPtr->data().tugCommandedHeading = computedTugHdg;
    pushbackDebugPtr->data().tugInertiaSpeed     = inertiaSpeed;
    pushbackDebugPtr->data().rotXOut             = counterRotationAcceleration;
    pushbackDebugPtr->writeDataToSim();
  }

  //  profiler.stop();
  //  profiler.print();

  return true;
}

bool Pushback::postUpdate([[maybe_unused]] sGaugeDrawData* pData) {
  //  empty
  return true;
}

bool Pushback::shutdown() {
  _isInitialized = false;
  LOG_INFO("Pushback::shutdown()");
  return true;
}
