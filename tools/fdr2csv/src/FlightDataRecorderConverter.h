#pragma once

#include <fstream>

#include "AdditionalData.h"
#include "AutopilotLaws_types.h"
#include "AutopilotStateMachine_types.h"
#include "Autothrust_types.h"
#include "EngineData.h"

class FlightDataRecorderConverter {
 public:
  FlightDataRecorderConverter() = delete;
  ~FlightDataRecorderConverter() = delete;

  static void writeHeader(std::ofstream& out, const std::string& delimiter);
  static void writeStruct(std::ofstream& out,
                          const std::string& delimiter,
                          const ap_sm_output& ap_sm,
                          const ap_raw_output& ap_law,
                          const athr_out& athr,
                          const EngineData& engine,
                          const AdditionalData& data);
};
