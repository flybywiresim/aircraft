// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifdef EXAMPLES

#ifndef FLYBYWIRE_EXAMPLEMODULE_H
#define FLYBYWIRE_EXAMPLEMODULE_H

#include <array>
#include <chrono>

#include "DataManager.h"
#include "Module.h"
#include "ClientEvent.h"

// Uncomment the following to enable/disable the examples
//
//#define LVAR_EXAMPLES
//#define AIRCRAFT_VAR_EXAMPLE
//#define INDEXED_AIRCRAFT_VAR_EXAMPLE
//#define DATA_DEFINITION_EXAMPLE
//#define CLIENT_DATA_AREA_EXAMPLE
//#define BIG_CLIENT_DATA_EXAMPLE
//#define STREAM_RECEIVE_EXAMPLE
//#define STREAM_SEND_EXAMPLE
//#define SIM_EVENT_EXAMPLE
//#define KEY_EVENT_EXAMPLE
//#define CUSTOM_EVENT_EXAMPLE
//#define SYSTEM_EVENT_EXAMPLE
//#define MASK_KEYBOARD_EXAMPLE

class MsfsHandler;

/**
 * This is an example and test module which is used to demonstrate the usage of the module system
 * and to debug the module and DataManager system.
 * It should have no effect on the simulation - it should not write to the sim other than while testing
 * Should be commented out from the Gauge - remove -DEXAMPLES compiler flag.
 */
class ExampleModule : public Module {
 private:
  // Notification group(s) for the module
  enum NotificationGroup { NOTIFICATION_GROUP_0 };

  // Input group(s) for the module
  enum InputGroup { INPUT_GROUP_0 };

  // Convenience pointer to the data manager
  DataManager* dataManager{};

#ifdef LVAR_EXAMPLES
  // LVARs
  NamedVariablePtr debugLVARPtr{};
  NamedVariablePtr debugLVAR2Ptr{};
  NamedVariablePtr debugLVAR3Ptr{};
  NamedVariablePtr debugLVAR4Ptr{};
#endif

#ifdef AIRCRAFT_VAR_EXAMPLE
  // Sim-vars
  AircraftVariablePtr beaconLightSwitchPtr;
  AircraftVariablePtr beaconLightSwitch2Ptr;
  AircraftVariablePtr beaconLightSwitch3Ptr;
  AircraftVariablePtr strobeLightSwitchPtr;
#endif

#ifdef INDEXED_AIRCRAFT_VAR_EXAMPLE
  AircraftVariablePtr fuelPumpSwitch1Ptr;
  AircraftVariablePtr fuelPumpSwitch2Ptr;
#endif

#ifdef DATA_DEFINITION_EXAMPLE
  // DataDefinition variables
  struct ExampleData {
    [[maybe_unused]] FLOAT64 strobeLightSwitch;
    [[maybe_unused]] FLOAT64 wingLightSwitch;
    [[maybe_unused]] FLOAT64 zuluTime;      // E:ZULU TIME
    [[maybe_unused]] FLOAT64 localTime;     // E:LOCAL TIME
    [[maybe_unused]] FLOAT64 absoluteTime;  // E:ABSOLUTE TIME
    // if the string is longer than 256 characters, it will overwrite the subsequent variables
    // and the sim might crash. It seems to be ok when the string is last in the struct.
    // Then the string is truncated to the size but seem to have no other effect (due to the memcpy
    // being restricted to the size of the struct).
    [[maybe_unused]] char aircraftTTitle[256] = "";
  };
  std::shared_ptr<DataDefinitionVariable<ExampleData>> exampleDataPtr;
#endif

#ifdef CLIENT_DATA_AREA_EXAMPLE
  // ClientDataArea variables
  struct ExampleClientData {
    [[maybe_unused]] FLOAT64 aFloat64;
    [[maybe_unused]] FLOAT32 aFloat32;
    [[maybe_unused]] INT64 anInt64;
    [[maybe_unused]] INT32 anInt32;
    [[maybe_unused]] INT16 anInt16;
    [[maybe_unused]] INT8 anInt8;
  } __attribute__((packed));
  std::shared_ptr<ClientDataAreaVariable<ExampleClientData>> exampleClientDataPtr;

  // Second ClientDataArea variable identical to the first one for testing
  struct ExampleClientData2 {
    [[maybe_unused]] INT8 anInt8;
    [[maybe_unused]] INT16 anInt16;
    [[maybe_unused]] INT32 anInt32;
    [[maybe_unused]] INT64 anInt64;
    [[maybe_unused]] FLOAT32 aFloat32;
    [[maybe_unused]] FLOAT64 aFloat64;
  } __attribute__((packed));
  std::shared_ptr<ClientDataAreaVariable<ExampleClientData2>> exampleClientData2Ptr;
#endif

#ifdef BIG_CLIENT_DATA_EXAMPLE
  // ClientDataArea variable for testing
  struct BigClientData {
    std::array<char, SIMCONNECT_CLIENTDATA_MAX_SIZE> dataChunk;
  } __attribute__((packed));
  std::shared_ptr<ClientDataAreaVariable<BigClientData>> bigClientDataPtr;
#endif

#if defined(STREAM_RECEIVE_EXAMPLE) || defined(STREAM_SEND_EXAMPLE)
  // Meta data struct for StreamingClientDataAreaVariable
  struct StreamingDataMetaData {
    UINT64 size;
    UINT64 hash;
  } __attribute__((packed));
#endif

#ifdef STREAM_RECEIVE_EXAMPLE
  // ClientDataBufferedArea variable for testing receiving
  std::shared_ptr<ClientDataAreaVariable<StreamingDataMetaData>> streamReceiverMetaDataPtr;
  std::shared_ptr<StreamingClientDataAreaVariable<char>> streamReveicerDataPtr;
#endif

#ifdef STREAM_SEND_EXAMPLE
  // ClientDataBufferedArea variable for testing sending
  std::shared_ptr<ClientDataAreaVariable<StreamingDataMetaData>> streamSenderMetaDataPtr;
  std::shared_ptr<StreamingClientDataAreaVariable<char>> streamSenderDataPtr;
#endif

#if defined(SIM_EVENT_EXAMPLE) || defined(AIRCRAFT_VAR_EXAMPLE) || defined(INDEXED_AIRCRAFT_VAR_EXAMPLE)
  // Events
  ClientEventPtr beaconLightSetEventPtr;
  [[maybe_unused]] CallbackID beaconLightSetCallbackID{};
  [[maybe_unused]] CallbackID beaconLightSetCallback2ID{};
  ClientEventPtr lightPotentiometerSetEventPtr;
  [[maybe_unused]] CallbackID lightPotentiometerSetCallbackID{};
  ClientEventPtr lightPotentiometerSetEvent2Ptr;
  [[maybe_unused]] CallbackID lightPotentiometerSetCallback2ID{};
#endif

#ifdef CUSTOM_EVENT_EXAMPLE
  // Custom Event
  ClientEventPtr clientEventPtr;
  [[maybe_unused]] CallbackID clientEventCallbackId{};
#endif

#ifdef SYSTEM_EVENT_EXAMPLE
  // System Event
  ClientEventPtr systemEventPtr;
  [[maybe_unused]] CallbackID systemEventCallbackId{};
#endif

#ifdef MASK_KEYBOARD_EXAMPLE
  ClientEventPtr inputEventPtr;
  [[maybe_unused]] CallbackID inputEventCallbackId{};
#endif

 public:
  ExampleModule() = delete;

  /**
   * Creates a new ExampleModule instance and takes a reference to the MsfsHandler instance.
   * @param msfsHandlerPtr The MsfsHandler instance that is used to communicate with the simulator.
   */
  explicit ExampleModule(MsfsHandler& msfsHandlerPtr) : Module(msfsHandlerPtr){};

  bool initialize() override;
  bool preUpdate(sGaugeDrawData* pData) override;
  bool update(sGaugeDrawData* pData) override;
  bool postUpdate(sGaugeDrawData* pData) override;
  bool shutdown() override;

 private:
#ifdef KEY_EVENT_EXAMPLE
  // key event test function
  void keyEventTest(DWORD param0, DWORD param1, DWORD param2, DWORD param3, DWORD param4) {
    std::cout << "ExampleModule::keyEventTest() - param0 = " << param0 << " param1 = " << param1 << " param2 = " << param2
              << " param3 = " << param3 << " param4 = " << param4 << std::endl;
  }
#endif

#ifdef STREAM_RECEIVE_EXAMPLE
  std::chrono::time_point<std::chrono::steady_clock, std::chrono::duration<long long int, std::nano>> streamReceiverTimerStart;
  std::chrono::duration<long long int, std::nano> streamReceiverTimerEnd;
#endif
};

#endif  // FLYBYWIRE_EXAMPLEMODULE_H

#endif  // EXAMPLES
