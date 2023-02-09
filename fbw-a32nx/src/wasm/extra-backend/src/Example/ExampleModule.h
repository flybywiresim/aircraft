// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifdef EXAMPLES

#ifndef FLYBYWIRE_EXAMPLEMODULE_H
#define FLYBYWIRE_EXAMPLEMODULE_H

#include "Module.h"
#include "DataManager.h"
#include "Event.h"

class MsfsHandler;

/**
 * This is an example  and test module which is used to demonstrate the usage of the module system
 * and to debug the module and DataManager system.
 * It has no effect on the simulation - it should never write to the sim other than in DEBUG mode
 * Should be commented out from the Gauge - remove -DEXAMPLES compiler flag.
 */
class ExampleModule : public Module {
private:
  // Convenience pointer to the data manager
  DataManager* dataManager{};

  // LVARs
  NamedVariablePtr debugLVARPtr{};
  NamedVariablePtr debugLVAR2Ptr{};
  NamedVariablePtr debugLVAR3Ptr{};
  NamedVariablePtr debugLVAR4Ptr{};

  // Sim-vars
  AircraftVariablePtr beaconLightSwitchPtr;
  AircraftVariablePtr beaconLightSwitch2Ptr;
  AircraftVariablePtr beaconLightSwitch3Ptr;
  AircraftVariablePtr fuelPumpSwitch1Ptr;
  AircraftVariablePtr fuelPumpSwitch2Ptr;
  AircraftVariablePtr zuluTimePtr;  // E:ZULU TIME (can't this be requested as aircraft variable?)

  // DataDefinition variables
  struct ExampleData {
    [[maybe_unused]] FLOAT64 strobeLightSwitch;
    [[maybe_unused]] FLOAT64 wingLightSwitch;
    [[maybe_unused]] FLOAT64 zuluTime; // E:ZULU TIME
    [[maybe_unused]] FLOAT64 localTime; // E:LOCAL TIME
    [[maybe_unused]] FLOAT64 absoluteTime; // E:ABSOLUTE TIME
  };
  std::shared_ptr<DataDefinitionVariable<ExampleData>> exampleDataPtr;

  // ClientDataArea variables
  struct ExampleClientData {
    FLOAT64 aFloat64;
    FLOAT32 aFloat32;
    INT64 anInt64;
    INT32 anInt32;
    INT16 anInt16;
    INT8 anInt8;
  } __attribute__((packed));
  std::shared_ptr<ClientDataAreaVariable<ExampleClientData>> exampleClientDataPtr;

  // Second ClientDataArea variable identical to the first one for testing
  struct ExampleClientData2 {
    INT8 anInt8;
    INT16 anInt16;
    INT32 anInt32;
    INT64 anInt64;
    FLOAT32 aFloat32;
    FLOAT64 aFloat64;
  } __attribute__((packed));
  std::shared_ptr<ClientDataAreaVariable<ExampleClientData2>> exampleClientData2Ptr;

  // Events
  EventPtr beaconLightSetEventPtr;
  [[maybe_unused]] CallbackID beaconLightSetCallbackID{};
  EventPtr toggleFlightDirectorEventPtr;
  [[maybe_unused]] CallbackID toggleFlightDirectorCallbackID{};
  EventPtr lightPotentiometerSetEventPtr;
  [[maybe_unused]] CallbackID lightPotentiometerSetCallbackID{};
  EventPtr lightPotentiometerSetEvent2Ptr;
  [[maybe_unused]] CallbackID lightPotentiometerSetCallback2ID{};

public:
  ExampleModule() = delete;

  /**
   * Creates a new ExampleModule instance and takes a reference to the MsfsHandler instance.
   * @param msfsHandler The MsfsHandler instance that is used to communicate with the simulator.
   */
  explicit ExampleModule(MsfsHandler* msfsHandler) : Module(msfsHandler) {};

  bool initialize() override;
  bool preUpdate(sGaugeDrawData* pData) override;
  bool update(sGaugeDrawData* pData) override;
  bool postUpdate(sGaugeDrawData* pData) override;
  bool shutdown() override;

};

#endif //FLYBYWIRE_EXAMPLEMODULE_H

#endif //EXAMPLES
