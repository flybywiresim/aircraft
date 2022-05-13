// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#pragma once

#include <MSFS/Legacy/gauges.h>
#include <MSFS/MSFS.h>
#include <MSFS/MSFS_Render.h>
#include <SimConnect.h>

#include <memory>

#include "Units.h"

class InertialDampener;

using namespace std;

/**
 * Class for handling aircraft presets.
 */
class Pushback {
 private:
  Units* m_Units{};
  std::unique_ptr<InertialDampener> inertialDampenerPtr;
  bool isInitialized = false;

  // LVARs
  ID PushbackSystemEnabled{};
  ID NwStrgDiscMemo{};
  ID pushbackPaused{};
  ID tugCommandedHeadingFactor{};
  ID tugCommandedSpeedFactor{};
  ID parkingBrakeEngaged{};

  // Simvars
  ENUM SimOnGround{};
  ENUM PushbackAttached{};
  ENUM aircraftHeading{};
  ENUM pushBackWait{};

 public:
  /**
   * Creates an instance of the Pushback class.
   */
  Pushback();

  /**
   * Destructor
   */
  ~Pushback();

  /**
   * Called when SimConnect is initialized
   */
  void initialize();

  /**
   * Callback used to update the LightPreset at each tick (dt).
   * This is used to execute every action and task required to update the light Settings.
   * @param deltaTime The time since the last tick
   * @return True if successful, false otherwise.
   */
  void onUpdate(double deltaTime);

  /**
   * Called when SimConnect is shut down
   */
  void shutdown();
};
