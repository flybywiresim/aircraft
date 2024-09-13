// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_MODULE_H
#define FLYBYWIRE_MODULE_H

#include <MSFS/Legacy/gauges.h>

#include "MsfsHandler.h"

/**
 * @brief The Module class is the base class and interface for all modules to
 * ensure that they are compatible with the MsfsHandler.
 *
 * Make sure to add an error (std::cerr) message if anything goes wrong and especially if
 * initialize(), preUpdate(), update() or postUpdate() return false.<p/>
 *
 * MSFS does not support Exception so good logging and error messages is the only way to inform the
 * user/developer if somethings went wrong and where and what happened.<p/>
 *
 * Non-excessive positive logging about what is happening is also a good idea and helps
 * tremendously with finding any issues as it will be easier to locate the cause of the issue.
 */
class Module {
 protected:
  /**
   * The MsfsHandler instance that is used to communicate with the simulator.
   */
  MsfsHandler& msfsHandler;

  /**
   * Flag to indicate if the module has been initialized.
   */
  bool _isInitialized = false;

 public:
  Module()                         = delete;  // no default constructor
  Module(const Module&)            = delete;  // no copy constructor
  Module& operator=(const Module&) = delete;  // no copy assignment
  virtual ~Module()                = default;

  /**
   * Creates a new module and takes a reference to the MsfsHandler instance.
   * @param msfsHandler The MsfsHandler instance that is used to communicate with the simulator.
   */
  explicit Module(MsfsHandler& backRef) : msfsHandler(backRef) { msfsHandler.registerModule(this); }

  /**
   * Called by the MsfsHandler instance once to initialize the module.
   * Happens during the PANEL_SERVICE_PRE_INSTALL message from the sim.
   * @return true if the module was successfully initialized, false otherwise.
   */
  virtual bool initialize() = 0;

  /**
   * Called first by the MsfsHandler instance during the PANEL_SERVICE_PRE_DRAW phase from the sim.
   * This is called directly after the DataManager::preUpdate() method and can be used for additional
   * pre-processing before the update() method is called.
   * @param pData sGaugeDrawData structure containing the data for the current frame.
   * @return false if an error occurred, true otherwise.
   */
  virtual bool preUpdate(sGaugeDrawData* pData) = 0;

  /**
   * Called by the MsfsHandler instance during the PANEL_SERVICE_PRE_DRAW phase from the sim.
   * This is called directly after the DataManager::update() method.
   * This is the main update method and should be used to implement the main logic of the module.
   * @param pData sGaugeDrawData structure containing the data for the current frame.
   * @return false if an error occurred, true otherwise.
   */
  virtual bool update(sGaugeDrawData* pData) = 0;

  /**
   * Called by the MsfsHandler instance during the PANEL_SERVICE_PRE_DRAW phase from the sim.
   * This is called directly after the DataManager::postUpdate() method and can be used for additional
   * post-processing after the update() method is called.
   * @param pData sGaugeDrawData structure containing the data for the current frame.
   * @return false if an error occurred, true otherwise.
   */
  virtual bool postUpdate(sGaugeDrawData* pData) = 0;

  /**
   * Called by the MsfsHandler instance during the PANEL_SERVICE_PRE_KILL phase from the sim.
   * @return false if an error occurred, true otherwise.
   */
  virtual bool shutdown() = 0;

  /**
   * @return true if the module has been initialized, false otherwise.
   */
  [[nodiscard]] bool isInitialized() const { return _isInitialized; }
};

#endif  // FLYBYWIRE_MODULE_H
