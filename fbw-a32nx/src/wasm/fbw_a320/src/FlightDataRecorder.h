#pragma once

#include <fstream>

#include "AdditionalData.h"
#include "EngineData.h"
#include "elac/Elac.h"
#include "fac/Fac.h"
#include "fcdc/Fcdc.h"
#include "model/AutopilotLaws.h"
#include "model/AutopilotStateMachine.h"
#include "model/Autothrust.h"
#include "sec/Sec.h"
#include "zfstream.h"

class FlightDataRecorder {
 public:
  // IMPORTANT: this constant needs to increased with every interface change
  const uint64_t INTERFACE_VERSION = 3200001;

  void initialize();

  void update(Elac elacs[2],
              Sec secs[3],
              Fac facs[2],
              AutopilotStateMachine* autopilotStateMachine,
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
