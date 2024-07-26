#pragma once

#include <fstream>

#include "AdditionalData.h"
#include "EngineData.h"
#include "FmgcComputer_types.h"
#include "zfstream.h"

class FlightDataRecorder {
 public:
  // IMPORTANT: this constant needs to increased with every interface change
  const uint64_t INTERFACE_VERSION = 26;

  void initialize();

  void update(const EngineData& engineData, const AdditionalData& additionalData, const fmgc_outputs& fmgc1, const fmgc_outputs& fmgc2);

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

  void writeFmgc(const fmgc_outputs& fmgc);
};
