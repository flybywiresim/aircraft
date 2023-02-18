// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifdef EXAMPLES

#ifndef FLYBYWIRE_EXAMPLEMODULE_H
#define FLYBYWIRE_EXAMPLEMODULE_H

#include <array>

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
    // if the string is longer than 256 characters, it will overwrite the subsequent variables
    // and the sim might crash. It seems to be ok when the string is last in the struct.
    // Then the string is truncated to the size but seem to have no other effect (due to the memcpy
    // being restricted to the size of the struct).
    [[maybe_unused]] char aircraftTTitle[256] = "";
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

  // ClientDataArea variable for testing
  struct BigClientData {
    std::array<BYTE, SIMCONNECT_CLIENTDATA_MAX_SIZE> dataChunk;
  } __attribute__((packed));
  std::shared_ptr<ClientDataAreaVariable<BigClientData>> bigClientDataPtr;

  // ClientDataArea variable for meta data for ClientDataBufferedAreaVariable
  struct BufferedAreaMetaData {
    UINT64 size;
    UINT64 hash;
  } __attribute__((packed));
  std::shared_ptr<ClientDataAreaVariable<BufferedAreaMetaData>> metaDataPtr;

  // ClientDataBufferedArea variable for testing
  std::shared_ptr<ClientDataBufferedAreaVariable<BYTE, SIMCONNECT_CLIENTDATA_MAX_SIZE>> hugeClientDataPtr;

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

private:

  // Fowler-Noll-Vo hash function
  uint64_t fingerPrintFVN(std::vector<BYTE> &data) {
    const uint64_t FNV_offset_basis = 14695981039346656037ULL;
    const uint64_t FNV_prime = 1099511628211ULL;
    uint64_t hash = FNV_offset_basis;
    for (BYTE c: data) {
      hash ^= static_cast<uint64_t>(c);
      hash *= FNV_prime;
    }
    return hash;
  }

};

#endif //FLYBYWIRE_EXAMPLEMODULE_H

#endif //EXAMPLES
