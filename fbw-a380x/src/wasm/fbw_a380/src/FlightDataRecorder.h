#pragma once

#include <fstream>

#include "AdditionalData.h"
#include "EngineData.h"
#include "model/AutopilotLaws.h"
#include "model/AutopilotStateMachine.h"
#include "model/Autothrust.h"
#include "zlib/zfstream.h"

class FlightDataRecorder {
 public:
  // IMPORTANT: this constant needs to increased with every interface change
  const uint64_t INTERFACE_VERSION = 24;

  void initialize();

  void update(AutopilotStateMachine* autopilotStateMachine,
              AutopilotLawsModelClass* autopilotLaws,
              Autothrust* autoThrust,
              const EngineData& engineData,
              const AdditionalData& additionalData);

  void terminate();

 private:
  const std::string CONFIGURATION_FILEPATH = "\\work\\FlightDataRecorder.ini";

  bool isEnabled = false;
  int sampleCounter = false;
  int maximumSampleCounter = 0;
  int maximumFileCount = 0;
  std::shared_ptr<gzofstream> fileStream;

  void manageFlightDataRecorderFiles();

  std::string getFlightDataRecorderFilename();

  void cleanUpFlightDataRecorderFiles();
};
