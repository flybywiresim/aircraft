// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifdef EXAMPLES

#include <iomanip>
#include <string>

#include "AircraftVariable.h"
#include "ClientEvent.h"
#include "ExampleModule.h"
#include "NamedVariable.h"
#include "fingerprint.hpp"
#include "logging.h"
#include "longtext.h"
#include "math_utils.hpp"

bool ExampleModule::initialize() {
  dataManager = &msfsHandler.getDataManager();

  /*
   * Update mode of a variable - last 4 optional parameters of the make_... calls:
   *
   * UpdateMode::AUTO_READ: automatically update from sim at every tick when update criteria are met
   * UpdateMode::AUTO_WRITE: automatically write to sim at every tick
   * maxAgeTime: maximum age of the variable in seconds (influences update reads)
   * maxAgeTicks: maximum age of the variable in ticks (influences update reads)
   *
   * default is "false, false, 0, 0"
   */


#ifdef LVAR_EXAMPLES
  // LVARS
  // requested multiple times to demonstrate de-duplication - also shows optional parameters
  // use this to familiarise yourself with the different parameters
  debugLVARPtr = dataManager->make_named_var("DEBUG_LVAR", UNITS.Hours, UpdateMode::AUTO_READ_WRITE, 0, 0);
  //  debugLVARPtr->setEpsilon(1.0);  // only read when difference is >1.0
  //  debugLVARPtr->addCallback([&, this]() { LOG_INFO("Callback: DEBUG_LVAR value changed to " + std::to_string(debugLVARPtr->get())); });
  // these are unique and not the same as the first
  debugLVAR2Ptr = dataManager->make_named_var("DEBUG_LVAR", UNITS.Minutes, UpdateMode::AUTO_READ, 0, 1000);
  debugLVAR3Ptr = dataManager->make_named_var("DEBUG_LVAR", UNITS.Seconds, UpdateMode::AUTO_READ, 5.0, 0);
  // this is a duplicate of the first one, so should be the same pointer
  debugLVAR4Ptr = dataManager->make_named_var("DEBUG_LVAR", UNITS.Hours, UpdateMode::NO_AUTO_UPDATE, 0, 0);
#endif

#if defined(SIM_EVENT_EXAMPLE) || defined(AIRCRAFT_VAR_EXAMPLE) || defined(INDEXED_AIRCRAFT_VAR_EXAMPLE)
  // Sim Events
  beaconLightSetEventPtr = dataManager->make_client_event("BEACON_LIGHTS_SET", true, NOTIFICATION_GROUP_0);
  beaconLightSetCallbackID = beaconLightSetEventPtr->addCallback(
      [&, this](const int number, const DWORD param0, const DWORD param1, const DWORD param2, const DWORD param3, const DWORD param4) {
        LOG_INFO("Callback: BEACON_LIGHTS_SET event received with " + std::to_string(number) +
                 " params:" + " 0: " + std::to_string(param0) + " 1: " + std::to_string(param1) + " 2: " + std::to_string(param2) +
                 " 3: " + std::to_string(param3) + " 4: " + std::to_string(param4) + " beaconLt: " + this->beaconLightSetEventPtr->str());
      });
  beaconLightSetCallback2ID = beaconLightSetEventPtr->addCallback(
      [&, this](const int number, const DWORD param0, const DWORD param1, const DWORD param2, const DWORD param3, const DWORD param4) {
        LOG_INFO("Callback 2: BEACON_LIGHTS_SET event received with " + std::to_string(number) +
                 " params:" + " 0: " + std::to_string(param0) + " 1: " + std::to_string(param1) + " 2: " + std::to_string(param2) +
                 " 3: " + std::to_string(param3) + " 4: " + std::to_string(param4) + " beaconLt: " + this->beaconLightSetEventPtr->str());
      });

  // Event with callback example
  lightPotentiometerSetEventPtr = dataManager->make_sim_event("LIGHT_POTENTIOMETER_SET", NOTIFICATION_GROUP_0);
  lightPotentiometerSetCallbackID =
      lightPotentiometerSetEventPtr->addCallback([=]([[maybe_unused]] int number,
                                                     [[maybe_unused]] DWORD param0,
                                                     [[maybe_unused]] DWORD param1,
                                                     [[maybe_unused]] DWORD param2,
                                                     [[maybe_unused]] DWORD param3,
                                                     [[maybe_unused]] DWORD param4) {
        if (param0 == 99)
          return;
        LOG_DEBUG("Callback 1: LIGHT_POTENTIOMETER_SET event received with " + std::to_string(number) +
                  " params:" + " 0: " + std::to_string(param0) + " 1: " + std::to_string(param1) + " 2: " + std::to_string(param2) +
                  " 3: " + std::to_string(param3) + " 4: " + std::to_string(param4));
      });

  // Second event with the same name - this should be de-duplicated
  lightPotentiometerSetEvent2Ptr = dataManager->make_sim_event("LIGHT_POTENTIOMETER_SET", NOTIFICATION_GROUP_0);
  lightPotentiometerSetCallback2ID =
      lightPotentiometerSetEvent2Ptr->addCallback([=]([[maybe_unused]] int number,
                                                      [[maybe_unused]] DWORD param0,
                                                      [[maybe_unused]] DWORD param1,
                                                      [[maybe_unused]] DWORD param2,
                                                      [[maybe_unused]] DWORD param3,
                                                      [[maybe_unused]] DWORD param4) {
        if (param0 == 99)
          return;
        LOG_DEBUG("Callback 2: LIGHT_POTENTIOMETER_SET event received with " + std::to_string(number) +
                  " params:" + " 0: " + std::to_string(param0) + " 1: " + std::to_string(param1) + " 2: " + std::to_string(param2) +
                  " 3: " + std::to_string(param3) + " 4: " + std::to_string(param4));
      });
#endif

#ifdef AIRCRAFT_VAR_EXAMPLE
  // Aircraft variables - requested multiple times to demonstrate de-duplication
  // to test change the units to either use the same units (will be deduplicated) or different units
  // in which case the variables will be unique.
  beaconLightSwitchPtr =
      dataManager->make_aircraft_var("LIGHT BEACON", 0, "", beaconLightSetEventPtr, UNITS.Percent, UpdateMode::AUTO_READ, 0, 0);
  beaconLightSwitch2Ptr =
      dataManager->make_aircraft_var("LIGHT BEACON", 0, "", beaconLightSetEventPtr, UNITS.Bool, UpdateMode::AUTO_READ, 5.0, 0);
  // using make_simple_aircraft_var() to demonstrate the same thing
  beaconLightSwitch3Ptr = dataManager->make_simple_aircraft_var("LIGHT BEACON", UNITS.PercentOver100);

  // using event name for execute_calculator_code example
  strobeLightSwitchPtr =
      dataManager->make_aircraft_var("LIGHT STROBE", 0, "STROBES_SET", nullptr, UNITS.Bool, UpdateMode::AUTO_READ, 0, 0);
#endif

#ifdef INDEXED_AIRCRAFT_VAR_EXAMPLE
  // A:FUELSYSTEM PUMP SWITCH:#ID#  - demonstrates variable with index
  // clang-format off
  fuelPumpSwitch1Ptr = dataManager->make_aircraft_var("FUELSYSTEM PUMP SWITCH", 2, "", beaconLightSetEventPtr, UNITS.Bool, UpdateMode::AUTO_READ, 0, 0);
  fuelPumpSwitch2Ptr = dataManager->make_aircraft_var("FUELSYSTEM PUMP SWITCH", 3, "", beaconLightSetEventPtr, UNITS.Bool, UpdateMode::AUTO_READ, 0, 0);
  // clang-format on
#endif

#ifdef DATA_DEFINITION_EXAMPLE
  // ========================================
  // Data definition variables
  std::vector<DataDefinition> exampleDataDef = {
      {"LIGHT STROBE", 0, UNITS.Bool},
      {"LIGHT WING", 0, UNITS.Bool},
      {"ZULU TIME"},
      {"LOCAL TIME"},
      {"ABSOLUTE TIME"},
      // The sim crashes if the string datatype is too short for the string
      {"TITLE", 0, UNITS.None, SIMCONNECT_DATATYPE_STRING256},
  };
  exampleDataPtr = dataManager->make_datadefinition_var<ExampleData>("EXAMPLE DATA", exampleDataDef, UpdateMode::AUTO_READ, 0, 0);
  // Alternative to use autoRead it is possible to set the SIMCONNECT_PERIOD.
  // this is probably very efficient for data definitions areas if every change needs to be read
  // or if the sim should only send data when it has changed.
  // See
  // https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Structures_And_Enumerations/SIMCONNECT_CLIENT_DATA_PERIOD.htm?rhhlterm=SIMCONNECT_CLIENT_DATA_PERIOD&rhsearch=SIMCONNECT_CLIENT_DATA_PERIOD
  if (!exampleDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME)) {
    LOG_ERROR("Failed to request periodic data from sim");
  }
#endif

#ifdef CLIENT_DATA_AREA_EXAMPLE
  // ========================================
  // Client data area owned by this module
  exampleClientDataPtr = dataManager->make_clientdataarea_var<ExampleClientData>("EXAMPLE CLIENT DATA", UpdateMode::AUTO_WRITE);
  exampleClientDataPtr->allocateClientDataArea(sizeof(ExampleClientData));

  // Client data area owned by an external module
  exampleClientData2Ptr = dataManager->make_clientdataarea_var<ExampleClientData2>("EXAMPLE 2 CLIENT DATA");
  exampleClientData2Ptr->setSkipChangeCheck(true);
  // this is probably very efficient for client data areas if every change needs to be read
  if (!exampleClientData2Ptr->requestPeriodicDataFromSim(SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET)) {
    LOG_ERROR("Failed to request periodic data from sim");
  }
#endif

#ifdef BIG_CLIENT_DATA_EXAMPLE
  // ========================================
  // Big client data area owned by an external module
  bigClientDataPtr = dataManager->make_clientdataarea_var<BigClientData>("BIG CLIENT DATA");
  bigClientDataPtr->setSkipChangeCheck(true);
  bigClientDataPtr->addCallback([&]() {
    // Big Client Data
    std::cout << "--- CALLBACK: BIG CLIENT DATA (External - reading)" << std::endl;
    std::cout << bigClientDataPtr->str() << std::endl;
    std::cout << "Big Client Data data: " << std::endl;
    auto s = std::string_view((const char*)&bigClientDataPtr->data().dataChunk, 100);
    std::cout << bigClientDataPtr->data().dataChunk.size() << " bytes: " << s << " ... " << std::endl;
    std::cout << "Fingerprint: "
              << Fingerprint::fingerPrintFVN(
                     std::vector(bigClientDataPtr->data().dataChunk.begin(), bigClientDataPtr->data().dataChunk.end()))
              << std::endl;
  });
  if (!bigClientDataPtr->requestPeriodicDataFromSim(SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET)) {
    LOG_ERROR("Failed to request periodic data from sim");
  }
#endif

#ifdef STREAM_RECEIVE_EXAMPLE
  // ========================================
  // Metadata for the StreamingClientDataAreaVariable test
  streamReceiverMetaDataPtr = dataManager->make_clientdataarea_var<StreamingDataMetaData>("STREAM RECEIVER META DATA");
  streamReceiverMetaDataPtr->setSkipChangeCheck(true);
  streamReceiverMetaDataPtr->addCallback([&]() {
    streamReceiverTimerStart = std::chrono::high_resolution_clock::now();
    streamReveicerDataPtr->reserve(streamReceiverMetaDataPtr->data().size);
    std::cout << "--- CALLBACK: STREAM RECEIVER META DATA (External - reading)" << std::endl;
    std::cout << streamReceiverMetaDataPtr->str() << std::endl;
    std::cout << "STREAM RECEIVER DATA META DATA size = " << streamReceiverMetaDataPtr->data().size
              << " fingerprint = " << streamReceiverMetaDataPtr->data().hash << std::endl;
  });
  if (!streamReceiverMetaDataPtr->requestPeriodicDataFromSim(SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET)) {
    LOG_ERROR("Failed to request periodic data from sim");
  }

  // ==============================================
  // StreamingClientDataAreaVariable receiving test
  streamReveicerDataPtr = dataManager->make_streamingclientdataarea_var<char>("STREAM RECEIVER DATA");
  streamReveicerDataPtr->setSkipChangeCheck(true);
  streamReveicerDataPtr->addCallback([&]() {
    streamReceiverTimerEnd =
        std::chrono::duration_cast<std::chrono::nanoseconds>(std::chrono::high_resolution_clock::now() - streamReceiverTimerStart);
    std::cout << "--- CALLBACK: STREAM RECEIVER DATA (External - reading)" << std::endl;
    std::cout << streamReveicerDataPtr->str() << std::endl;
    const uint64_t fingerPrintFvn = Fingerprint::fingerPrintFVN(streamReveicerDataPtr->getData());
    std::cout << "STREAM RECEIVER DATA "
              << " size = " << streamReveicerDataPtr->getData().size() << " bytes = " << streamReveicerDataPtr->getReceivedBytes()
              << " chunks = " << streamReveicerDataPtr->getReceivedChunks() << " fingerprint = " << std::setw(21) << fingerPrintFvn
              << " (match = " << std::boolalpha << (fingerPrintFvn == streamReceiverMetaDataPtr->data().hash) << ")"
              << " time = " << std::setw(10) << streamReceiverTimerEnd.count() << " ns" << std::endl;
    std::cout << "Content: "
              << "[" << std::string(streamReveicerDataPtr->getData().begin(), streamReveicerDataPtr->getData().begin() + 100) << " ... ]"
              << std::endl;
  });
  if (!SUCCEEDED(streamReveicerDataPtr->requestPeriodicDataFromSim(SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET))) {
    LOG_ERROR("Failed to request periodic data from sim");
  }
#endif

#ifdef STREAM_SEND_EXAMPLE
  // ============================================
  // StreamingClientDataAreaVariable sending test
  streamSenderMetaDataPtr = dataManager->make_clientdataarea_var<StreamingDataMetaData>("STREAM SENDER META DATA");
  streamSenderMetaDataPtr->allocateClientDataArea();
  streamSenderDataPtr = dataManager->make_streamingclientdataarea_var<char, SIMCONNECT_CLIENTDATA_MAX_SIZE>("STREAM SENDER DATA");
  streamSenderDataPtr->allocateClientDataArea();
  streamSenderDataPtr->getData().assign(longText.begin(), longText.end());
#endif

#ifdef KEY_EVENT_EXAMPLE
  // ======================
  // Key event tests
  // Test callback a member method using this->
  [[maybe_unused]] auto keyEventId = dataManager->addKeyEventCallback(
      KEY_BEACON_LIGHTS_SET, [&, this](DWORD param0, DWORD param1, DWORD param2, DWORD param3, DWORD param4) {
        this->keyEventTest(param0, param1, param2, param3, param4);
      });
  // Test a second callback using a lambda
  [[maybe_unused]] auto keyEventId2 =
      dataManager->addKeyEventCallback(KEY_BEACON_LIGHTS_SET, [&](DWORD param0, DWORD param1, DWORD param2, DWORD param3, DWORD param4) {
        std::cout << "Callback 2: KEY_BEACON_LIGHTS_SET "
                  << " param0 = " << param0 << " param1 = " << param1 << " param2 = " << param2 << " param3 = " << param3
                  << " param4 = " << param4 << std::endl;
      });
#endif

#ifdef CUSTOM_EVENT_EXAMPLE
  // ======================
  // Client Event tests
  // Simple custom client event - no mappings
  clientEventPtr = dataManager->make_custom_event("A32NX.MY_CUSTOM_EVENT");
#endif

#ifdef SYSTEM_EVENT_EXAMPLE
  // ======================
  // System Events
  // Create the client event with the registerToSim flag set to false, so we can add
  // client event to system event. When this is set to true (default) the client event
  // will be registered to the sim either as a custom event or a mapped event (if the event name exists) and an
  // error will be thrown if you try to register the system event to the sim.
  systemEventPtr = dataManager->make_system_event("A32NX.SYSTEM_EVENT_VIEW", "View");
  systemEventCallbackId = systemEventPtr->addCallback(
      [&](const int number, const DWORD param0, const DWORD param1, const DWORD param2, const DWORD param3, const DWORD param4) {
        std::cout << "--- CALLBACK: A32NX.SYSTEM_EVENT_VIEW" << std::endl;
        std::cout << systemEventPtr->str() << std::endl;
        std::cout << "A32NX.SYSTEM_EVENT_VIEW"
                  << " number = " << number << " param0 = " << param0 << " param1 = " << param1 << " param2 = " << param2
                  << " param3 = " << param3 << " param4 = " << param4 << std::endl;
        std::cout << std::endl;
      });
#endif

#ifdef MASK_KEYBOARD_EXAMPLE
  inputEventPtr = dataManager->make_custom_event("A32NX.MASK_KEYBOARD", NOTIFICATION_GROUP_0);
  inputEventCallbackId = inputEventPtr->addCallback(
      [&](const int number, const DWORD param0, const DWORD param1, const DWORD param2, const DWORD param3, const DWORD param4) {
        std::cout << "--- CALLBACK: A32NX.MASK_KEYBOARD" << std::endl;
        std::cout << inputEventPtr->str() << std::endl;
        std::cout << "A32NX.MASK_KEYBOARD"
                  << " number = " << number << " param0 = " << param0 << " param1 = " << param1 << " param2 = " << param2
                  << " param3 = " << param3 << " param4 = " << param4 << std::endl;
        std::cout << std::endl;
      });
  // Masking seems not to work - the sim still receives the key events
  inputEventPtr->mapInputDownEvent("VK_LCONTROL+e", INPUT_GROUP_0, true);
  inputEventPtr->mapInputDownEvent("VK_RCONTROL+e", INPUT_GROUP_0, true);
  inputEventPtr->setInputGroupPriority(INPUT_GROUP_0, SIMCONNECT_GROUP_PRIORITY_HIGHEST);
#endif

  _isInitialized = true;
  LOG_INFO("ExampleModule initialized");
  return true;
}

bool ExampleModule::preUpdate([[maybe_unused]] sGaugeDrawData* pData) {
  // empty  could be used to manually update variables if they are not autoRead
  return true;
}

bool ExampleModule::update([[maybe_unused]] sGaugeDrawData* pData) {
  if (!_isInitialized) {
    LOG_ERROR("ExampleModule::update() - not initialized");
    return false;
  }

  // Do not do anything if the sim is not running - this is not required but is a good idea
  // It is ready after the click on "READY TO FLY"
  if (!msfsHandler.getAircraftIsReadyVar())
    return true;

    // Un-throttled tests
#ifdef STREAM_RECEIVE_EXAMPLE
    //  if (streamReceiverMetaDataPtr->hasChanged()) {
    //    // STREAM RECEIVER DATA Meta Data
    //    LOG_INFO("--- HUGE CLIENT META DATA (External - reading)");
    //    streamReveicerDataPtr->reserve(streamReceiverMetaDataPtr->data().size);
    //    std::cout << streamReceiverMetaDataPtr->str() << std::endl;
    //    std::cout << "STREAM RECEIVER DATA size: " << streamReceiverMetaDataPtr->data().size << std::endl;
    //    std::cout << "STREAM RECEIVER DATA hash: " << streamReceiverMetaDataPtr->data().hash << std::endl;
    //  }

    //  if (streamReveicerDataPtr->hasChanged()) {
    //    LOG_INFO("--- STREAM RECEIVER DATA (External - reading)");
    //    std::cout << streamReveicerDataPtr->str() << std::endl;
    //    std::cout << "STREAM RECEIVER DATA size: " << streamReveicerDataPtr->getData().size() << std::endl;
    //    std::string s(streamReveicerDataPtr->getData().data(), streamReveicerDataPtr->getData().size());
    //    auto fingerprint = fingerPrintFVN(s);
    //    std::cout << "Fingerprint: " << fingerprint << std::endl;
    //    std::cout << "Fingerprint is " << (fingerprint == streamReceiverMetaDataPtr->data().hash ? "equal" : "not equal") << std::endl;
    //  }
#endif

  // Use this to throttle output frequency while you are debugging
  if (msfsHandler.getTickCounter() % 100 == 0) {
    [[maybe_unused]] const FLOAT64 timeStamp = msfsHandler.getTimeStamp();
    [[maybe_unused]] const UINT64 tickCounter = msfsHandler.getTickCounter();

    std::cout << "==== tickCounter = " << tickCounter << " timeStamp = " << timeStamp << " =============================" << std::endl;

    LOG_DEBUG("A32NX_IS_READY = " + std::string(msfsHandler.getAircraftIsReadyVar() ? "true" : "false") +
              " A32NX_DEVELOPER_STATE = " + std::to_string(msfsHandler.getAircraftDevelopmentStateVar()));

#ifdef CUSTOM_EVENT_EXAMPLE
    // ======================
    // Client Event Tests

    if (tickCounter % 2000 == 1000) {
      if (!clientEventPtr->isRegisteredToSim()) clientEventPtr->mapToSimEvent();
      // this will trigger an SimConnect error if the event is already registered to this group
      clientEventPtr->addClientEventToNotificationGroup(NOTIFICATION_GROUP_0);
      clientEventCallbackId = clientEventPtr->addCallback(
          [&, this](const int number, const DWORD param0, const DWORD param1, const DWORD param2, const DWORD param3, const DWORD param4) {
            std::cout << "--- CALLBACK: A32NX.MY_CUSTOM_EVENT" << std::endl;
            std::cout << clientEventPtr->str() << std::endl;
            std::cout << "CUSTOM_EVENT "
                      << " number = " << number << " param0 = " << param0 << " param1 = " << param1 << " param2 = " << param2
                      << " param3 = " << param3 << " param4 = " << param4 << std::endl;
            std::cout << std::endl;
          });
      clientEventPtr->mapInputDownUpEvent("VK_COMMA", INPUT_GROUP_0);
      clientEventPtr->mapInputDownUpEvent("joystick:1:button:7", INPUT_GROUP_0);
      clientEventPtr->setInputGroupState(INPUT_GROUP_0, SIMCONNECT_STATE_ON);
    }
    if (tickCounter % 2000 == 0) {
      clientEventPtr->removeCallback(clientEventCallbackId);
      clientEventPtr->unmapInputEvent("VK_COMMA", INPUT_GROUP_0);
      // this will trigger a SimConnect exception UNRECOGNIZED_ID but actually will remove the mapping
      // without this adding the mapping again will lead to two events being sent for the input
      // likely a bug in SimConnect/MSFS
      clientEventPtr->unmapInputEvent("joystick:1:button:7", INPUT_GROUP_0);
      clientEventPtr->removeClientEventFromNotificationGroup(NOTIFICATION_GROUP_0);
    }
    clientEventPtr->trigger(999);
#endif

#ifdef LVAR_EXAMPLES
    // clang-format off

    // difference if using different units
    LOG_INFO("--- LVAR EXAMPLE");
    LOG_INFO("timeStamp = " + std::to_string(timeStamp) + " / ticks = " + std::to_string(msfsHandler.getTickCounter()));

    LOG_INFO("debugLVARPtr  DEBUG_LVAR (hours)   = " + std::to_string(debugLVARPtr->get()));
    LOG_INFO("debugLVAR2Ptr DEBUG_LVAR (minutes) = " + std::to_string(debugLVAR2Ptr->get()));
    LOG_INFO("debugLVAR3Ptr DEBUG_LVAR (seconds) = " + std::to_string(debugLVAR3Ptr->get()));

    // this second read of the duplicate should not trigger a read from the sim
    // enable LOG_TRACE to see the read in updateFromSim()
    LOG_INFO("debugLVAR4Ptr DEBUG_LVAR (hours)   = " + std::to_string(debugLVAR4Ptr->get()));

    // testing doubled LVARs
    std::cout << "Pointer Address of duplicates:  debugLVARPtr=" << std::addressof(*debugLVARPtr) << " debugLVAR4Ptr=" << std::addressof(*debugLVAR4Ptr) << std::endl;


    LOG_INFO("Setting DEBUG_LVAR to tickCounter  = " + std::to_string(tickCounter));
    debugLVARPtr->set(tickCounter);

    // manual changing in the sim's LocalVariables dialog - uncomment below and comment out above
    //
    // std::cout << "debugLVARPtr =  " << debugLVARPtr->get() << " changed? " << (debugLVARPtr->hasChanged() ? "yes" : "no") << " debugLVARPtr  time = " << msfsHandlerPtr.getTimeStamp() << " tick = " << msfsHandlerPtr.getTickCounter() << std::endl;
    // std::cout << "debugLVAR2Ptr = " << debugLVAR2Ptr->get() << " changed? " << (debugLVAR2Ptr->hasChanged() ? "yes" : "no") << " debugLVAR2Ptr time = " << msfsHandlerPtr.getTimeStamp() << " tick = " << msfsHandlerPtr.getTickCounter() << std::endl;

    // Set a variable which does not auto write - uncomment below and comment out above
    // debugLVARPtr->setAndWriteToSim(debugLVARPtr->get() + 1);

    // clang-format on
#endif

#ifdef AIRCRAFT_VAR_EXAMPLE
    // Read vars which auto update each tick
    std::cout << "beaconLightSwitchPtr =  " << beaconLightSwitchPtr->get() << " changed? "
              << (beaconLightSwitchPtr->hasChanged() ? "yes" : "no") << " beaconLightSwitchPtr  time = " << msfsHandler.getTimeStamp()
              << " tick = " << msfsHandler.getTickCounter() << std::endl;
    std::cout << "beaconLightSwitch2Ptr = " << beaconLightSwitch2Ptr->get() << " changed? "
              << (beaconLightSwitch2Ptr->hasChanged() ? "yes" : "no") << " beaconLightSwitch2Ptr time = " << msfsHandler.getTimeStamp()
              << " tick = " << msfsHandler.getTickCounter() << std::endl;
    std::cout << "beaconLightSwitch3Ptr = " << beaconLightSwitch3Ptr->updateFromSim(timeStamp, tickCounter) << " changed? "
              << (beaconLightSwitch3Ptr->hasChanged() ? "yes" : "no") << " beaconLightSwitch3Ptr time = " << msfsHandler.getTimeStamp()
              << " tick = " << msfsHandler.getTickCounter() << std::endl;
    std::cout << "strobeLightSwitchPtr =  " << strobeLightSwitchPtr->get() << " changed? "
              << (strobeLightSwitchPtr->hasChanged() ? "yes" : "no") << " strobeLightSwitchPtr  time = " << msfsHandler.getTimeStamp()
              << " tick = " << msfsHandler.getTickCounter() << std::endl;

    // Test writing an aircraft variable by toggling the strobe light switch
    // Immediate write
    // strobeLightSwitchPtr->setAndWriteToSim(strobeLightSwitchPtr->get() == 0.0 ? 1.0 : 0.0);

    // Trigger event
    // beaconLightSetKeyEventPtr->trigger_ex1(beaconLightSwitchPtr->get() == 0.0 ? 1.0 : 0.0);
    // autoWrite in postUpdate
    // beaconLightSwitch2Ptr->set(beaconLightSwitch2Ptr->get() == 0.0 ? 1.0 : 0.0);
#endif

#ifdef INDEXED_AIRCRAFT_VAR_EXAMPLE
    std::cout << "fuelPumpSwitch1Ptr = " << fuelPumpSwitch1Ptr->get() << " changed? " << (fuelPumpSwitch2Ptr->hasChanged() ? "yes" : "no")
              << " time = " << msfsHandler.getTimeStamp() << " tick = " << msfsHandler.getTickCounter() << std::endl;

    std::cout << "fuelPumpSwitch2Ptr = " << fuelPumpSwitch2Ptr->get() << " changed? " << (fuelPumpSwitch2Ptr->hasChanged() ? "yes" : "no")
              << " time = " << msfsHandler.getTimeStamp() << " tick = " << msfsHandler.getTickCounter() << std::endl;
#endif

#ifdef DATA_DEFINITION_EXAMPLE
    // testing data definition variables
    LOG_INFO("--- TEST SIMOBJECT DATA");
    std::cout << exampleDataPtr->str() << std::endl;

    LOG_INFO("--- DataDefinition Example)");
    exampleDataPtr->requestUpdateFromSim(timeStamp, tickCounter);
    std::cout << "strobeLightSwitch =  " << exampleDataPtr->data().strobeLightSwitch << std::endl;
    std::cout << "wingLightSwitch =  " << exampleDataPtr->data().wingLightSwitch << std::endl;
    std::cout << "zuluTime =  " << exampleDataPtr->data().zuluTime << std::endl;
    std::cout << "localTime =  " << exampleDataPtr->data().localTime << std::endl;
    std::cout << "absoluteTime =  " << INT64(exampleDataPtr->data().absoluteTime) << std::endl;
    std::cout << "aircraftTTitle =  " << exampleDataPtr->data().aircraftTTitle << std::endl;
#endif

#ifdef CLIENT_DATA_AREA_EXAMPLE
    // Testing client data variables
    // Can be tested together with https://github.com/frankkopp/fbw-cpp-framework-test

    // This local data sent to other clients
    LOG_INFO("--- EXAMPLE CLIENT DATA (Owning - sending)");
    std::cout << exampleClientDataPtr->str() << std::endl;
    std::cout << "FLOAT64    " << exampleClientDataPtr->data().aFloat64 << std::endl;
    std::cout << "FLOAT32    " << exampleClientDataPtr->data().aFloat32 << std::endl;
    std::cout << "INT64      " << exampleClientDataPtr->data().anInt64 << std::endl;
    std::cout << "INT32      " << exampleClientDataPtr->data().anInt32 << std::endl;
    std::cout << "INT16      " << exampleClientDataPtr->data().anInt16 << std::endl;
    std::cout << "INT8       " << int(exampleClientDataPtr->data().anInt8) << std::endl;
    exampleClientDataPtr->data().aFloat64 += 0.1;
    exampleClientDataPtr->data().aFloat32 += 0.1f;
    exampleClientDataPtr->data().anInt64++;
    exampleClientDataPtr->data().anInt32++;
    exampleClientDataPtr->data().anInt16++;
    exampleClientDataPtr->data().anInt8++;
    // exampleClientDataPtr->writeDataToSim();

    // This is external data from an external client
    LOG_INFO("--- EXAMPLE 2 CLIENT DATA (External - reading)");
    std::cout << exampleClientData2Ptr->str() << std::endl;
    // if (!exampleClientData2Ptr->requestUpdateFromSim(timeStamp, tickCounter)) {
    //    LOG_ERROR("ExampleModule::update() - exampleClientData2Ptr->requestUpdateFromSim() failed");
    // }
    std::cout << "INT8       " << int(exampleClientData2Ptr->data().anInt8) << std::endl;
    std::cout << "INT16      " << exampleClientData2Ptr->data().anInt16 << std::endl;
    std::cout << "INT32      " << exampleClientData2Ptr->data().anInt32 << std::endl;
    std::cout << "INT64      " << exampleClientData2Ptr->data().anInt64 << std::endl;
    std::cout << "FLOAT32    " << exampleClientData2Ptr->data().aFloat32 << std::endl;
    std::cout << "FLOAT64    " << exampleClientData2Ptr->data().aFloat64 << std::endl;
#endif

#ifdef STREAM_SEND_EXAMPLE
    // clang-format off
    // ======================
    // Sending large data to the sim
    streamSenderMetaDataPtr->data().size = streamSenderDataPtr->getData().size();
    streamSenderMetaDataPtr->data().hash = Fingerprint::fingerPrintFVN(streamSenderDataPtr->getData());
    streamSenderMetaDataPtr->writeDataToSim();
    LOG_DEBUG("--- STREAM SENDER DATA - writing: " + std::to_string(streamSenderMetaDataPtr->data().size) + " bytes + fingerprint: " + std::to_string(streamSenderMetaDataPtr->data().hash));
    streamSenderDataPtr->writeDataToSim();
    // clang-format on
#endif

  }  // update throttle

  return true;
}

bool ExampleModule::postUpdate([[maybe_unused]] sGaugeDrawData* pData) {
  return true;
}

bool ExampleModule::shutdown() {
  _isInitialized = false;
  std::cout << "ExampleModule::shutdown()" << std::endl;
  return true;
}

#endif
