#pragma once

#include <fstream>

#include "FmgcComputer_types.h"
#include "RecordingDataTypes.h"
#include "elac/Elac.h"
#include "fac/Fac.h"
#include "sec/Sec.h"
#include "zfstream.h"

class FlightDataRecorder {
 public:
  // IMPORTANT: this constant needs to increased with every interface change
  const uint64_t INTERFACE_VERSION = 26;

  const uint32_t NUMBER_OF_ELAC_TO_WRITE = 1;
  const uint32_t NUMBER_OF_SEC_TO_WRITE = 1;
  const uint32_t NUMBER_OF_FAC_TO_WRITE = 1;

  void initialize();

  void update(const BaseData& baseData,
              const AircraftSpecificData& aircraftSpecificData,
              Elac elacs[2],
              Sec secs[3],
              Fac facs[2],
              const fmgc_outputs& fmgc1,
              const fmgc_outputs& fmgc2,
              const EngineData& engineData);

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

  void writeElac(Elac& elac);

  void writeSec(Sec& sec);

  void writeFac(Fac& fac);

  void writeFmgc(const fmgc_outputs& fmgc);
};
