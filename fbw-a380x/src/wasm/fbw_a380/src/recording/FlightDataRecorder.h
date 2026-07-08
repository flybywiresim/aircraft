#pragma once

#include <fstream>

#include "../interface/FuelSystemData.h"
#include "../model/AutopilotLaws.h"
#include "../model/AutopilotStateMachine.h"
#include "../model/Autothrust.h"
#include "../prim/Prim.h"
#include "../sec/Sec.h"
#include "LocalVariable.h"
#include "RecordingDataTypes.h"
#include "zlib/zfstream.h"

class FlightDataRecorder {
 public:
  // IMPORTANT: this constant needs to increased with every interface change
  const uint64_t INTERFACE_VERSION = 3800007;

  const uint32_t NUMBER_OF_PRIM_TO_WRITE = 3;
  const uint32_t NUMBER_OF_SEC_TO_WRITE = 3;

  void initialize();

  void update(const BaseData& baseData,
              const AircraftSpecificData& aircraftSpecificData,
              Prim (&prims)[3],
              Sec (&secs)[3],
              const AutopilotStateMachine& autopilotStateMachine,
              const AutopilotLawsModelClass& autopilotLaws,
              const Autothrust& autoThrust,
              const FuelSystemData& fuelSystemData);

  void terminate();

 private:
  const std::string CONFIGURATION_FILEPATH = "\\work\\FlightDataRecorder.ini";

  std::unique_ptr<LocalVariable> idIsEnabled;
  int sampleCounter = 0;
  int maximumSampleCounter = 864000;
  int maximumFileCount = 15;
  std::shared_ptr<gzofstream> fileStream;

  void manageFlightDataRecorderFiles();

  std::string getFlightDataRecorderFilename();

  void cleanUpFlightDataRecorderFiles();

  void loadConfiguration();

  void writePrim(Prim& prim);

  void writeSec(Sec& sec);
};
