// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifdef EXAMPLES

#include "logging.h"
#include "ExampleModule.h"
#include "NamedVariable.h"
#include "AircraftVariable.h"

bool ExampleModule::initialize() {

  dataManager = &msfsHandler->getDataManager();

  /*
   * Update mode of a variable - last 4 optional parameters of the make_... calls:
   *
   * autoRead: automatically update from sim at every tick when update criteria are met
   * autoWrite: automatically write to sim at every tick
   * maxAgeTime: maximum age of the variable in seconds (influences update reads)
   * maxAgeTicks: maximum age of the variable in ticks (influences update reads)
   *
   * default is "false, false, 0, 0"
   */

  // Events
  beaconLightSetEventPtr = dataManager->make_event("BEACON_LIGHTS_SET");
  /*    beaconLightSetCallbackID = beaconLightSetEventPtr
        ->addCallback([&, this](const int number, const DWORD param0, const DWORD param1,
                                const DWORD param2, const DWORD param3, const DWORD param4) {
          LOG_INFO("Callback: BEACON_LIGHTS_SET event received with " + std::to_string(number)
                   + " params:"
                   + " 0: " + std::to_string(param0)
                   + " 1: " + std::to_string(param1)
                   + " 2: " + std::to_string(param2)
                   + " 3: " + std::to_string(param3)
                   + " 4: " + std::to_string(param4)
                   + " beaconLt: " + this->beaconLightSetEventPtr->str()
          );
        });*/

  /*    beaconLightSetCallbackID = beaconLightSetEventPtr
        ->addCallback([&, this](const int number, const DWORD param0, const DWORD param1,
                                const DWORD param2, const DWORD param3, const DWORD param4) {
          LOG_INFO("Callback 2: BEACON_LIGHTS_SET event received with " + std::to_string(number)
                   + " params:"
                   + " 0: " + std::to_string(param0)
                   + " 1: " + std::to_string(param1)
                   + " 2: " + std::to_string(param2)
                   + " 3: " + std::to_string(param3)
                   + " 4: " + std::to_string(param4)
                   + " beaconLt: " + this->beaconLightSetEventPtr->str()
          );
        });*/

  // Event with Callback example
  toggleFlightDirectorEventPtr = dataManager->make_event("TOGGLE_FLIGHT_DIRECTOR");
  /*    toggleFlightDirectorCallbackID = toggleFlightDirectorEventPtr
        ->addCallback([=](int number, DWORD param0, DWORD param1, DWORD param2, DWORD param3,
                          DWORD param4) {
          LOG_DEBUG("Callback 1: TOGGLE_FLIGHT_DIRECTOR event received with " + std::to_string(number)
                    + " params:"
                    + " 0: " + std::to_string(param0)
                    + " 1: " + std::to_string(param1)
                    + " 2: " + std::to_string(param2)
                    + " 3: " + std::to_string(param3)
                    + " 4: " + std::to_string(param4)
          );
        });*/

  // Event with Callback example - twice to see multiple callbacks added to a single event
  lightPotentiometerSetEventPtr = dataManager->make_event("LIGHT_POTENTIOMETER_SET");
  /*    lightPotentiometerSetCallbackID = lightPotentiometerSetEventPtr
        ->addCallback([=](int number, DWORD param0, DWORD param1, DWORD param2, DWORD param3,
                          DWORD param4) {
          LOG_DEBUG("Callback 1: LIGHT_POTENTIOMETER_SET event received with " + std::to_string(number)
                    + " params:"
                    + " 0: " + std::to_string(param0)
                    + " 1: " + std::to_string(param1)
                    + " 2: " + std::to_string(param2)
                    + " 3: " + std::to_string(param3)
                    + " 4: " + std::to_string(param4)
          );
        });
      lightPotentiometerSetEventPtr->subscribeToSim();*/

  lightPotentiometerSetEvent2Ptr = dataManager->make_event("LIGHT_POTENTIOMETER_SET");
  /*    lightPotentiometerSetCallback2ID = lightPotentiometerSetEvent2Ptr
        ->addCallback([=](int number, DWORD param0, DWORD param1, DWORD param2, DWORD param3,
                          DWORD param4) {
          LOG_DEBUG("Callback 2: LIGHT_POTENTIOMETER_SET event received with " + std::to_string(number)
                    + " params:"
                    + " 0: " + std::to_string(param0)
                    + " 1: " + std::to_string(param1)
                    + " 2: " + std::to_string(param2)
                    + " 3: " + std::to_string(param3)
                    + " 4: " + std::to_string(param4)
          );
        });*/

  // LVARS
  // requested multiple times to demonstrate de-duplication - also shows optional parameters
  debugLVARPtr = dataManager->make_named_var("DEBUG_LVAR", UNITS.Hours, true, false, 0, 0);
  debugLVARPtr->setEpsilon(1.0); // only read when difference is >1.0

  // these are unique and not the same as the first
  debugLVAR2Ptr = dataManager->make_named_var("DEBUG_LVAR", UNITS.Minutes, false, false, 0, 0);
  debugLVAR3Ptr = dataManager->make_named_var("DEBUG_LVAR", UNITS.Seconds, false, false, 0, 0);

  // this is a duplicate of the first one, so should be the same pointer
  debugLVAR4Ptr = dataManager->make_named_var("DEBUG_LVAR", UNITS.Hours, false, false, 0, 0);

  // Aircraft variables - requested multiple times to demonstrate de-duplication
  // to test change the units to either use the same units (will be deduplicated) or different units
  // in which case the variables will be unique.
  beaconLightSwitchPtr = dataManager->make_aircraft_var("LIGHT BEACON", 0, "", beaconLightSetEventPtr, UNITS.Percent, false, false, 0, 0);
  beaconLightSwitch2Ptr = dataManager->make_aircraft_var("LIGHT BEACON", 0, "", beaconLightSetEventPtr, UNITS.Bool, true, true, 0, 0);
  beaconLightSwitch3Ptr = dataManager->make_simple_aircraft_var("LIGHT BEACON", UNITS.PercentOver100);

  // E: variables - don't seem to work as aircraft variables
  zuluTimePtr = dataManager->make_simple_aircraft_var("ZULU TIME", UNITS.Number, true);

  // A:FUELSYSTEM PUMP SWITCH:#ID#  - demonstrates variable with index
  fuelPumpSwitch1Ptr = dataManager->make_aircraft_var("FUELSYSTEM PUMP SWITCH", 1, "",
                                                      beaconLightSetEventPtr, UNITS.Bool, true, false, 0, 0);
  fuelPumpSwitch2Ptr = dataManager->make_aircraft_var("FUELSYSTEM PUMP SWITCH", 2, "",
                                                      beaconLightSetEventPtr, UNITS.Bool, true, false, 0, 0);

  // Data definition variables
  std::vector <DataDefinition> exampleDataDef = {
    {"TITLE",        0, UNITS.None, SIMCONNECT_DATATYPE_STRING256},
    {"LIGHT STROBE", 0, UNITS.Bool},
    {"LIGHT WING",   0, UNITS.Bool},
    {"ZULU TIME"},
    {"LOCAL TIME"},
    {"ABSOLUTE TIME"},
  };
  exampleDataPtr = dataManager
    ->make_datadefinition_var<ExampleData>("EXAMPLE DATA", exampleDataDef, true, false, 0, 0);

  // Alternative to use autoRead it is possible to set the SIMCONNECT_PERIOD.
  // this is probably very efficient for data definitions areas if every change needs to be read
  // or if the sim should only send data when it has changed.
  // See https://docs.flightsimulator.com/html/Programming_Tools/SimConnect/API_Reference/Structures_And_Enumerations/SIMCONNECT_CLIENT_DATA_PERIOD.htm?rhhlterm=SIMCONNECT_CLIENT_DATA_PERIOD&rhsearch=SIMCONNECT_CLIENT_DATA_PERIOD
  //  if (!exampleDataPtr->requestPeriodicDataFromSim(SIMCONNECT_PERIOD_VISUAL_FRAME)) {
  //    LOG_ERROR("Failed to request periodic data from sim");
  //  }

  // Client data area owned by this module
  exampleClientDataPtr =
    dataManager->make_clientdataarea_var<ExampleClientData>("EXAMPLE CLIENT DATA", false, true);
  exampleClientDataPtr->allocateClientDataArea();

  // Client data area owned by an external module
  exampleClientData2Ptr =
    dataManager->make_clientdataarea_var<ExampleClientData2>("EXAMPLE 2 CLIENT DATA");
  // exampleClientData2Ptr->setSkipChangeCheck(true);
  // this is probably very efficient for client data areas if every change needs to be read
  if (!exampleClientData2Ptr->requestPeriodicDataFromSim(SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET)) {
    LOG_ERROR("Failed to request periodic data from sim");
  }

  isInitialized = true;
  LOG_INFO("ExampleModule initialized");
  return true;
}

bool ExampleModule::preUpdate([[maybe_unused]] sGaugeDrawData* pData) {
  // empty  could be used to manually update variables if they are not autoRead
  return true;
}

bool ExampleModule::update([[maybe_unused]] sGaugeDrawData* pData) {
  if (!isInitialized) {
    LOG_ERROR("ExampleModule::update() - not initialized");
    return false;
  }

  // Do not do anything if the sim is not running - this is not required but is a good idea
  // It is ready after the click on "READY TO FLY"
  if (!msfsHandler->getA32NxIsReady()) return true;


  // Use this to throttle output frequency while you are debugging
  if (msfsHandler->getTickCounter() % 100 == 0) {

    [[maybe_unused]] const FLOAT64 timeStamp = msfsHandler->getTimeStamp();
    [[maybe_unused]] const UINT64 tickCounter = msfsHandler->getTickCounter();

    // difference if using different units
    /*     debugLVAR3Ptr->setAndWriteToSim(msfsHandler->getTickCounter());
            LOG_INFO("--- DEBUG_LVAR");
            LOG_INFO("timeStamp = " + std::to_string(timeStamp)
                     + "/ ticks = " + std::to_string(msfsHandler->getTickCounter()));
            LOG_INFO("debugLVARPtr  DEBUG_LVAR "
                     + std::to_string(reinterpret_cast<int>(debugLVARPtr.get())) + " "
                     + std::to_string(debugLVARPtr->updateFromSim(timeStamp, tickCounter)));
            LOG_INFO("debugLVAR2Ptr DEBUG_LVAR " + std::to_string(debugLVAR2Ptr->updateFromSim(msfsHandler->getTimeStamp(), msfsHandler->getTickCounter())));
            LOG_INFO("debugLVAR3Ptr DEBUG_LVAR " + std::to_string(debugLVAR3Ptr->updateFromSim(msfsHandler->getTimeStamp(), msfsHandler->getTickCounter())));
         this second read of the duplicate should not trigger a read from the sim*/
    /*        LOG_INFO("debugLVAR4Ptr DEBUG_LVAR "
                     + std::to_string(reinterpret_cast<int>(debugLVARPtr.get())) + " "
                     + std::to_string(debugLVAR4Ptr->updateFromSim(timeStamp, tickCounter)));

            LOG_INFO("beaconLightSwitchPtr  DEBUG_BEACON " + std::to_string(beaconLightSwitchPtr->rawReadFromSim()));
            LOG_INFO("beaconLightSwitch2Ptr DEBUG_BEACON " + std::to_string(beaconLightSwitch2Ptr->rawReadFromSim()));
            LOG_INFO("beaconLightSwitch3Ptr DEBUG_BEACON " + std::to_string(beaconLightSwitch3Ptr->rawReadFromSim()));
            LOG_INFO("--- DEBUG_BEACON");*/

    // testing removing an event callback
    /*        if (msfsHandler->getTimeStamp() >= 30 && msfsHandler->getTimeStamp() < 31) {
              lightPotentiometerSetEvent2Ptr->removeCallback(lightPotentiometerSetCallback2ID);
            }*/

    // testing doubled LVARs
    /*        std::cout << *debugLVARPtr << std::endl;
                std::cout << *debugLVAR2Ptr << std::endl;
                std::cout << "TESTING 1212" << std::endl;*/

    // testing aircraft variables
    // std::cout << beaconLightSwitchPtr->str() << std::endl;

    // testing data definition variables
    /*        LOG_INFO("--- DEBUG SIMOBJECT DATA");
            std::cout << exampleDataPtr->str() << std::endl;
            exampleDataPtr->requestUpdateFromSim(timeStamp, tickCounter);
            std::cout << "LIGHT WING " << exampleDataPtr->data().wingLightSwitch << std::endl;
            std::cout << "ZULU       " << exampleDataPtr->data().zuluTime << std::endl;
            std::cout << "LOCAL      " << exampleDataPtr->data().localTime << std::endl;
            exampleDataPtr->requestUpdateFromSim(timeStamp, tickCounter);
            std::cout << "LIGHT WING " << exampleDataPtr->data().wingLightSwitch << std::endl;
            std::cout << "ZULU       " << exampleDataPtr->data().zuluTime << std::endl;
            std::cout << "LOCAL      " << exampleDataPtr->data().localTime << std::endl;*/

    // testing client data variables

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


    // Read vars which auto update each tick
    /*
     std::cout << "debugLVAR2Ptr = " << debugLVAR2Ptr->get() << " changed? "
               << (debugLVAR2Ptr->hasChanged() ? "yes" : "no")
               << " debugLVAR2Ptr time = " << msfsHandler->getPreviousSimulationTime()
               << " tick = " << msfsHandler->getTickCounter()
               << std::endl;

     std::cout << "beaconLightSwitchPtr =  " << beaconLightSwitchPtr->get() << " changed? "
               << (beaconLightSwitchPtr->hasChanged() ? "yes" : "no")
               << " beaconLightSwitchPtr  time = " << msfsHandler->getPreviousSimulationTime()
               << " tick = " << msfsHandler->getTickCounter()
               << std::endl;

     std::cout << "beaconLightSwitch2Ptr = " << beaconLightSwitch2Ptr->get() << " changed? "
               << (beaconLightSwitch2Ptr->hasChanged() ? "yes" : "no")
               << " beaconLightSwitch2Ptr time = " << msfsHandler->getPreviousSimulationTime()
               << " tick = " << msfsHandler->getTickCounter()
               << std::endl;

     std::cout << "beaconLightSwitch3Ptr = " << beaconLightSwitch3Ptr->get() << " changed? "
               << (beaconLightSwitch3Ptr->hasChanged() ? "yes" : "no")
               << " beaconLightSwitch3Ptr time = " << msfsHandler->getPreviousSimulationTime()
               << " tick = " << msfsHandler->getTickCounter()
               << std::endl;

     std::cout << "fuelPumpSwitch1Ptr = " << fuelPumpSwitch1Ptr->get() << " changed? "
               << (fuelPumpSwitch2Ptr->hasChanged() ? "yes" : "no")
               << " time = " << msfsHandler->getPreviousSimulationTime()
               << " tick = " << msfsHandler->getTickCounter()
               << std::endl;

     std::cout << "fuelPumpSwitch2Ptr = " << fuelPumpSwitch2Ptr->get() << " changed? "
               << (fuelPumpSwitch2Ptr->hasChanged() ? "yes" : "no")
               << " time = " << msfsHandler->getPreviousSimulationTime()
               << " tick = " << msfsHandler->getTickCounter()
               << std::endl;

     std::cout << "zuluTimePtr = " << zuluTimePtr->get() << " changed? "
               << (zuluTimePtr->hasChanged() ? "yes" : "no")
               << " time = " << msfsHandler->getTimeStamp()
               << " tick = " << msfsHandler->getTickCounter()
               << std::endl;
*/

    LOG_INFO("--- DataDefinition Example)");
    std::cout << "aircraftTTitle =  " << exampleDataPtr->data().aircraftTTitle << std::endl;
    std::cout << "strobeLightSwitch =  " << exampleDataPtr->data().strobeLightSwitch << std::endl;
    std::cout << "strobeLightSwitch =  " << exampleDataPtr->data().wingLightSwitch << std::endl;
    std::cout << "zuluTime =  " << exampleDataPtr->data().zuluTime << std::endl;
    std::cout << "localTime =  " << exampleDataPtr->data().localTime << std::endl;
    std::cout << "absoluteTime =  " << INT64(exampleDataPtr->data().absoluteTime) << std::endl;

    LOG_INFO("--- LVAR Example)");
    std::cout << "debugLVARPtr =  " << debugLVARPtr->get() << " changed? "
              << (debugLVARPtr->hasChanged() ? "yes" : "no")
              << " debugLVARPtr  time = " << msfsHandler->getTimeStamp()
              << " tick = " << msfsHandler->getTickCounter()
              << std::endl;
    // Set a variable which does not auto write
    //    debugLVARPtr->setAndWriteToSim(debugLVARPtr->get() + 1);

    // Test writing an aircraft variable by toggling the beacon light switch
    /*     Immediate write
            beaconLightSwitchPtr->setAndWriteToSim(beaconLightSwitchPtr->get() == 0.0 ? 1.0 : 0.0);
            beaconLightSetKeyEventPtr->trigger_ex1(beaconLightSwitchPtr->get() == 0.0 ? 1.0 : 0.0);
         autoWrite in postUpdate
            beaconLightSwitch2Ptr->set(beaconLightSwitch2Ptr->get() == 0.0 ? 1.0 : 0.0);

         Test writing a data definition variable by toggling the strobe light switch
            exampleDataStruct.strobeLightSwitch = exampleDataStruct.strobeLightSwitch == 0.0 ? 1.0 : 0.0;
            exampleDataPtr->writeDataToSim();*/

  } // throttle

  return true;
}

bool ExampleModule::postUpdate([[maybe_unused]] sGaugeDrawData* pData) {
  return true;
}

bool ExampleModule::shutdown() {
  isInitialized = false;
  std::cout << "ExampleModule::shutdown()" << std::endl;
  return true;
}

#endif
