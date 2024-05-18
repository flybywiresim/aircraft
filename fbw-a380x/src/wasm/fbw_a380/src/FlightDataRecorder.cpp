#include <dirent.h>
#include <ini.h>
#include <ini_type_conversion.h>
#include <stdio.h>
#include <chrono>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <vector>

#include "FlightDataRecorder.h"

using namespace mINI;

void FlightDataRecorder::initialize() {
  // read configuration
  INIStructure iniStructure;
  INIFile iniFile(CONFIGURATION_FILEPATH);
  if (!iniFile.read(iniStructure)) {
    // file does not exist yet -> store the default configuration in a file
    iniStructure["FLIGHT_DATA_RECORDER"]["ENABLED"] = "true";
    iniStructure["FLIGHT_DATA_RECORDER"]["MAXIMUM_NUMBER_OF_FILES"] = "15";
    iniStructure["FLIGHT_DATA_RECORDER"]["MAXIMUM_NUMBER_OF_ENTRIES_PER_FILE"] = "864000";
    iniFile.write(iniStructure, true);
  }

  // read basic configuration
  isEnabled = INITypeConversion::getBoolean(iniStructure, "FLIGHT_DATA_RECORDER", "ENABLED", true);
  maximumFileCount = INITypeConversion::getInteger(iniStructure, "FLIGHT_DATA_RECORDER", "MAXIMUM_NUMBER_OF_FILES", 15);
  maximumSampleCounter = INITypeConversion::getInteger(iniStructure, "FLIGHT_DATA_RECORDER", "MAXIMUM_NUMBER_OF_ENTRIES_PER_FILE", 864000);

  // print configuration
  std::cout << "WASM: Flight Data Recorder Configuration : Enabled                        = " << isEnabled << std::endl;
  std::cout << "WASM: Flight Data Recorder Configuration : MaximumNumberOfFiles           = " << maximumFileCount << std::endl;
  std::cout << "WASM: Flight Data Recorder Configuration : MaximumNumberOfEntriesPerFile  = " << maximumSampleCounter << std::endl;
  std::cout << "WASM: Flight Data Recorder Configuration : Interface Version              = " << INTERFACE_VERSION << std::endl;
}

void FlightDataRecorder::update(AutopilotStateMachine* autopilotStateMachine,
                                AutopilotLawsModelClass* autopilotLaws,
                                Autothrust* autoThrust,
                                const EngineData& engineData,
                                const AdditionalData& additionalData) {
  // check if enabled
  if (!isEnabled) {
    return;
  }

  // do file management
  manageFlightDataRecorderFiles();

  // write data to file
  fileStream->write((char*)(&autopilotStateMachine->getExternalOutputs().out), sizeof(autopilotStateMachine->getExternalOutputs().out));
  fileStream->write((char*)(&autopilotLaws->getExternalOutputs().out.output), sizeof(autopilotLaws->getExternalOutputs().out.output));
  fileStream->write((char*)(&autoThrust->getExternalOutputs().out), sizeof(autoThrust->getExternalOutputs().out));
  fileStream->write((char*)(&engineData), sizeof(engineData));
  fileStream->write((char*)(&additionalData), sizeof(additionalData));
}

void FlightDataRecorder::terminate() {
  if (fileStream) {
    fileStream->close();
    fileStream.reset();
  }
}

void FlightDataRecorder::manageFlightDataRecorderFiles() {
  // increase sample counter
  sampleCounter++;

  // check if file is considered full
  if (sampleCounter >= maximumSampleCounter) {
    // close file and delete
    if (fileStream) {
      fileStream->close();
      fileStream.reset();
    }
    // reset counter
    sampleCounter = 0;
  }

  if (!fileStream) {
    // create new file
    fileStream = std::make_shared<gzofstream>(getFlightDataRecorderFilename().c_str());
    // write version to file
    fileStream->write((char*)&INTERFACE_VERSION, sizeof(INTERFACE_VERSION));
    // clean up directory
    cleanUpFlightDataRecorderFiles();
  }
}

std::string FlightDataRecorder::getFlightDataRecorderFilename() {
  // get time
  auto in_time_t = std::chrono::system_clock::to_time_t(std::chrono::system_clock::now());

  // get filepath based on time
  std::stringstream result;
  result << std::put_time(std::gmtime(&in_time_t), "\\work\\%Y-%m-%d-%H-%M-%S.fdr");

  // return result
  return result.str();
}

void FlightDataRecorder::cleanUpFlightDataRecorderFiles() {
  // std::vector for directory entries
  std::vector<std::string> files;

  // extension
  std::string extension = "fdr";

  // structure representing an directory entry
  struct dirent* directoryEntry;

  // open directory
  DIR* directory = opendir("\\work");

  // read directory until end
  while ((directoryEntry = readdir(directory)) != NULL) {
    // get filename as std::string
    std::string filename = directoryEntry->d_name;

    // check if file has right extension
    if (filename.find(extension, (filename.length() - extension.length())) != std::string::npos) {
      files.push_back(std::move(filename));
    }
  }

  // close directory
  closedir(directory);

  // sort std::vector
  std::sort(files.begin(), files.end(), std::greater<>());

  // remove older files
  while (files.size() > maximumFileCount) {
    bool result = remove(("\\work\\" + files.back()).c_str());
    files.pop_back();
  }
}
