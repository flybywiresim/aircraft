// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_MSFSHANDLER_H
#define FLYBYWIRE_MSFSHANDLER_H

#include <MSFS/Legacy/gauges.h>
#include <MSFS/MSFS.h>
#include <SimConnect.h>

#include <string>
#include <vector>

#include "DataManager.h"

class Module;

/**
 * MsfsHandler is a lightweight abstraction layer for the MSFS SDK and Simconnect to handle the
 * communication with the simulator mainly for standard variables and events.
 * It is not meant to fully replace the SDK but to provide a simple interface for the most common
 * tasks.
 * It does not limit the direct usage of the SDK or Simconnect in any way!
 */
class MsfsHandler {

  /**
   * A list of all modules that are currently loaded.
   * This list is used to call the preUpdate, update and postUpdate methods of each module.
   * Each module is responsible for registering itself in this list - this is done in the
   * constructor of the module.
   * The order of the modules in this list is important as the update methods are called in
   * the order of the list. The order is determined by the order of creation of the modules.
   */
  std::vector<Module*> modules{};

  /**
   * The data manager is responsible for managing all variables and events.
   * It is used to register variables and events and to update them.
   * It de-duplicates variables and events and only creates one instance of each if multiple modules
   * use the same variable or event.
   */
  DataManager dataManager;

  /**
   * Each simconnect instance has a name to identify it.
   */
  std::string simConnectName;

  /**
   * The handle of the simconnect instance.
   */
  HANDLE hSimConnect{};

  /**
   * Flag to indicate if the MsfsHandler instance is initialized.
   */
  bool isInitialized = false;

  /**
   * This struct is used to define the data definition for the base sim data.
   */
  struct BaseSimData {
    FLOAT64 simulationTime;
  };

  // Common variables required by the MsfsHandler itself
  NamedVariablePtr a32nxIsReady;
  NamedVariablePtr a32nxIsDevelopmentState;
  std::shared_ptr<DataDefinitionVariable<BaseSimData>> baseSimData;

  /**
   * Current simulation time used for pause detection and time stamping variable updates
   */
  FLOAT64 timeStamp{};

  /**
   * Counts the number of ticks since start instance creation (calls to update). Used to
   * tick stamping the variable updates.
   */
  UINT64 tickCounter{};

public:
  /**
   * Creates a new MsfsHandler instance.
   * @param name string containing an appropriate simconnect name for the client program.
   */
  explicit MsfsHandler(std::string name) : dataManager(this), simConnectName(std::move(name)) {}

  /**
   * Initializes the MsfsHandler instance. This method must be called before any other method.
   * Opens a simconnect instance, initializes the data manager and calls initialize on all modules.
   * Is called by the gauge handler when the PANEL_SERVICE_PRE_INSTALL event is received.
   * @return true if the initialization was successful, false otherwise.
   */
  bool initialize();

  /**
   * Calls the preUpdate, update, postUpdate method of the DataManager and all modules.
   * Is called by the gauge handler when the PANEL_SERVICE_PRE_DRAW event is received.
   * @param pData pointer to the sGaugeDrawData struct.
   * @return true if the update was successful, false otherwise.
   */
  bool update(sGaugeDrawData* pData);

  /**
   * Calls the shutdown method of the DataManager and all modules and closes the simconnect instance.
   * Is called by the gauge handler when the PANEL_SERVICE_PRE_KILL event is received.
   * @return true if the shutdown was successful, false otherwise.
   */
  bool shutdown();

  /**
   * Callback method for modules to register themselves. This is done in the constructor of the
   * module base class.
   * @param pModule pointer to the module that should be registered.
   */
  void registerModule(Module* pModule);


  // Getters and setters
public:

  /**
   * @return a modifiable reference to the data manager.
   */
  DataManager &getDataManager() { return dataManager; }

  /**
   * @return value of LVAR A32NX_IS_READY
   */
  [[maybe_unused]] [[nodiscard]]
  bool getA32NxIsReady() const;

  /**
   *
   * @return value of LVAR A32NX_DEVELOPMENT_STATE
   */
  [[maybe_unused]] [[nodiscard]]
  FLOAT64 getA32NxIsDevelopmentState() const;

  /**
   * @return the current simulation time
   */
  [[maybe_unused]] [[nodiscard]]
  FLOAT64 getTimeStamp() const { return timeStamp; }

  /**
   * @return the current tick counter
   */
  [[maybe_unused]] [[nodiscard]]
  UINT64 getTickCounter() const { return tickCounter; }
};

#endif // FLYBYWIRE_MSFSHANDLER_H
