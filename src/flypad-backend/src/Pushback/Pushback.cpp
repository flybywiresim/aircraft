// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <iostream>
#include <chrono>

#include "InertialDampener.h"
#include "Pushback.h"

using namespace std::chrono;

static constexpr double SPEED_RATIO = 18.0;
static constexpr double TURN_SPEED_RATIO = 0.16;

Pushback::Pushback(HANDLE hdl, PushbackData* data) {
  hSimConnect = hdl;
  pushbackDataPtr = data;
  m_Units = std::make_unique<Units>();
  inertialDampenerPtr = std::make_unique<InertialDampener>(0.0, 0.15);
}

Pushback::~Pushback() = default;;

void Pushback::initialize() {
  // LVARs are initialized here
  pushbackSystemEnabled = register_named_variable("A32NX_PUSHBACK_SYSTEM_ENABLED");
  updateDelta = register_named_variable("A32NX_PUSHBACK_UPDT_DELTA");
  parkingBrakeEngaged = register_named_variable("A32NX_PARK_BRAKE_LEVER_POS");
  tugCommandedSpeedFactor = register_named_variable("A32NX_PUSHBACK_SPD_FACTOR");
  tugCommandedHeadingFactor = register_named_variable("A32NX_PUSHBACK_HDG_FACTOR");
  tugCommandedSpeed = register_named_variable("A32NX_PUSHBACK_SPD");
  tugCommandedHeading = register_named_variable("A32NX_PUSHBACK_HDG");
  tugInertiaSpeed = register_named_variable("A32NX_PUSHBACK_INERTIA_SPD");
  rotXOut = register_named_variable("A32NX_PUSHBACK_R_X_OUT");

  // Read only Simvars
  pushbackAttached = get_aircraft_var_enum("Pushback Attached");
  simOnGround = get_aircraft_var_enum("SIM ON GROUND");
  aircraftHeading = get_aircraft_var_enum("PLANE HEADING DEGREES TRUE");
  windVelBodyZ = get_aircraft_var_enum("RELATIVE WIND VELOCITY BODY Z");

  // Writable Simvars in FlyPadBackend via simconnect data definitions

  isInitialized = true;
  std::cout << "FLYPAD_BACKEND: Pushback initialized" << std::endl;
}

void Pushback::onUpdate(double deltaTime) {
  if (!isInitialized || !isPushbackSystemEnabled() || !isPushbackAttached() || !isSimOnGround()) {
    return;
  }

  // auto start = high_resolution_clock::now();

  // Calculate movement data and update shared data (debug info)
  set_named_variable_value(updateDelta, deltaTime);

  const FLOAT64 tugCmdSpdFactor = getTugCmdSpdFactor();
  const bool parkBrakeEngaged = isParkingBrakeEngaged();

  const FLOAT64 tugCmdSpd = tugCmdSpdFactor * (parkBrakeEngaged ? (SPEED_RATIO / 10) : SPEED_RATIO);
  set_named_variable_value(tugCommandedSpeed, tugCmdSpd); // debug

  const FLOAT64 inertiaSpeed = inertialDampenerPtr->updateSpeed(tugCmdSpd);
  set_named_variable_value(tugInertiaSpeed, inertiaSpeed); // debug

  const FLOAT64 computedHdg = angleAdd(getAircraftTrueHeading(), -50 * getTugCmdHdgFactor());
  set_named_variable_value(tugCommandedHeading, computedHdg); // debug

  const FLOAT64 computedRotationVelocity = sgn<FLOAT64>(tugCmdSpd)
                                           * getTugCmdHdgFactor()
                                           * (parkBrakeEngaged ? (TURN_SPEED_RATIO / 10) : TURN_SPEED_RATIO);

  // As we might use the elevator for taxiing we compensate for wind to avoid
  // the aircraft lifting any gears.
  const FLOAT64 windCounterRotAccel = getWindVelBodyZ() / 1000.0;
  FLOAT64 movementCounterRotAccel = windCounterRotAccel;
  if (inertiaSpeed > 0) {
    movementCounterRotAccel -= 1.1;
  }
  else if (inertiaSpeed < 0) {
    movementCounterRotAccel += 2.0;
  }
  else {
    movementCounterRotAccel = 0.0;
  }
  set_named_variable_value(rotXOut, movementCounterRotAccel); // debug

  // K:KEY_TUG_HEADING expects an unsigned integer scaling 360° to 0 to 2^32-1 (0xffffffff / 360)
  static const int32_t headingToInt32 = 0xffffffff / 360;
  const auto convertedComputedHeading = static_cast<int32_t >(static_cast<uint32_t>(computedHdg * headingToInt32));

  // send K:KEY_TUG_HEADING event
  HRESULT result = SimConnect_TransmitClientEvent(
    hSimConnect,
    0,
    Events::KEY_TUG_HEADING_EVENT,
    convertedComputedHeading,
    SIMCONNECT_GROUP_PRIORITY_HIGHEST,
    SIMCONNECT_EVENT_FLAG_GROUPID_IS_PRIORITY);

  //  K:KEY_TUG_SPEED - seems to actually do nothing
  //  result &= SimConnect_TransmitClientEvent(hSimConnect,
  //  0, Events::KEY_TUG_SPEED_EVENT, inertiaSpeed,
  //  SIMCONNECT_GROUP_PRIORITY_HIGHEST, SIMCONNECT_EVENT_FLAG_GROUPID_IS_PRIORITY);

  // Update sim data
  pushbackDataPtr->pushbackWait = inertiaSpeed == 0 ? 1 : 0;
  pushbackDataPtr->velBodyZ = inertiaSpeed;
  pushbackDataPtr->rotVelBodyY = computedRotationVelocity;
  pushbackDataPtr->rotAccelBodyX = movementCounterRotAccel;
  result &= SimConnect_SetDataOnSimObject(
    hSimConnect,
    DataStructureIDs::PushbackDataID,
    SIMCONNECT_OBJECT_ID_USER,
    0,
    0,
    sizeof(*pushbackDataPtr),
    pushbackDataPtr);

  // check result of data request
  if (result != S_OK) {
    std::cout << "FLYPAD_BACKEND (Pushback): Writing to sim failed! " << std::endl;
  }

  //  auto elapsed = duration_cast<microseconds>(high_resolution_clock::now() - start);
  //  std::cout << "FLYPAD_BACKEND (Pushback): Elapsed = " << elapsed.count() << " micro seconds"
  //            << std::endl;
}

void Pushback::shutdown() {
  isInitialized = false;
  std::cout << "FLYPAD_BACKEND (Pushback): Pushback shutdown" << std::endl;
}
