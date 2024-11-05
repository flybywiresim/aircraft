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
  // create local variables
  idIsEnabled = std::make_unique<LocalVariable>("A32NX_FDR_ENABLED");
  idMaximumFileCount = std::make_unique<LocalVariable>("A32NX_FDR_MAXIMUM_NUMBER_OF_FILES");
  idMaximumSampleCounter = std::make_unique<LocalVariable>("A32NX_FDR_MAXIMUM_NUMBER_OF_ENTRIES_PER_FILE");

  // load configuration
  loadConfiguration();

  // print configuration
  std::cout << "WASM: Flight Data Recorder Configuration : Enabled                        = " << idIsEnabled->get() << std::endl;
  std::cout << "WASM: Flight Data Recorder Configuration : MaximumNumberOfFiles           = " << idMaximumFileCount->get() << std::endl;
  std::cout << "WASM: Flight Data Recorder Configuration : MaximumNumberOfEntriesPerFile  = " << idMaximumSampleCounter->get() << std::endl;
  std::cout << "WASM: Flight Data Recorder Configuration : Interface Version              = " << INTERFACE_VERSION << std::endl;
}

void FlightDataRecorder::update(const BaseData& baseData,
                                const AircraftSpecificData& aircraftSpecificData,
                                Prim (&prims)[3],
                                Sec (&secs)[3],
                                Fac (&facs)[2],
                                const AutopilotStateMachine& autopilotStateMachine,
                                const AutopilotLawsModelClass& autopilotLaws,
                                const Autothrust& autoThrust,
                                const FuelSystemData& fuelSystemData) {
  // check if enabled
  if (!idIsEnabled->get()) {
    return;
  }

  // do file management
  manageFlightDataRecorderFiles();

  // write base data
  fileStream->write((char*)(&baseData), sizeof(baseData));

  // write aircraft specific data
  fileStream->write((char*)(&aircraftSpecificData), sizeof(aircraftSpecificData));

  // write PRIM data
  for (int i = 0; i < NUMBER_OF_PRIM_TO_WRITE; ++i) {
    writePrim(prims[i]);
  }

  // write SEC data
  for (int i = 0; i < NUMBER_OF_SEC_TO_WRITE; ++i) {
    writeSec(secs[i]);
  }

  // write Pseudo FACs data
  for (int i = 0; i < NUMBER_OF_FAC_TO_WRITE; ++i) {
    writeFac(facs[i]);
  }

  // write AP state machine data
  auto autopilotStateMachineOut = autopilotStateMachine.getExternalOutputs().out;
  fileStream->write((char*)(&autopilotStateMachineOut), sizeof(autopilotStateMachineOut));

  // write AP laws data
  auto autopilotLawsOut = autopilotLaws.getExternalOutputs().out;
  fileStream->write((char*)(&autopilotLawsOut), sizeof(autopilotLawsOut));

  // write ATHR data
  auto autoThrustOut = autoThrust.getExternalOutputs().out;
  fileStream->write((char*)(&autoThrustOut), sizeof(autoThrustOut));

  // write fuel system data
  fileStream->write((char*)(&fuelSystemData), sizeof(fuelSystemData));
}

void FlightDataRecorder::writePrim(Prim& prim) {
  auto bus_outputs = prim.getBusOutputs();
  fileStream->write((char*)(&bus_outputs), sizeof(bus_outputs));
  auto discrete_outputs = prim.getDiscreteOutputs();
  fileStream->write((char*)(&discrete_outputs), sizeof(discrete_outputs));
  auto analog_outputs = prim.getAnalogOutputs();
  fileStream->write((char*)(&analog_outputs), sizeof(analog_outputs));
}

void FlightDataRecorder::writeSec(Sec& sec) {
  auto bus_outputs = sec.getBusOutputs();
  fileStream->write((char*)(&bus_outputs), sizeof(bus_outputs));
  auto discrete_outputs = sec.getDiscreteOutputs();
  fileStream->write((char*)(&discrete_outputs), sizeof(discrete_outputs));
  auto analog_outputs = sec.getAnalogOutputs();
  fileStream->write((char*)(&analog_outputs), sizeof(analog_outputs));
}

void FlightDataRecorder::writeFac(Fac& fac) {
  auto bus_outputs = fac.getBusOutputs();
  fileStream->write((char*)(&bus_outputs), sizeof(bus_outputs));
  auto discrete_outputs = fac.getDiscreteOutputs();
  fileStream->write((char*)(&discrete_outputs), sizeof(discrete_outputs));
  auto analog_outputs = fac.getAnalogOutputs();
  fileStream->write((char*)(&analog_outputs), sizeof(analog_outputs));
}

void FlightDataRecorder::terminate() {
  if (fileStream) {
    fileStream->close();
    fileStream.reset();
  }
  writeConfiguration();
}

void FlightDataRecorder::loadConfiguration() {
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
  idIsEnabled->set(INITypeConversion::getBoolean(iniStructure, "FLIGHT_DATA_RECORDER", "ENABLED", true));
  idMaximumFileCount->set(INITypeConversion::getInteger(iniStructure, "FLIGHT_DATA_RECORDER", "MAXIMUM_NUMBER_OF_FILES", 15));
  idMaximumSampleCounter->set(
      INITypeConversion::getInteger(iniStructure, "FLIGHT_DATA_RECORDER", "MAXIMUM_NUMBER_OF_ENTRIES_PER_FILE", 864000));
}

void FlightDataRecorder::writeConfiguration() {
  // create ini file
  INIFile iniFile(CONFIGURATION_FILEPATH);

  // create structure
  INIStructure iniStructure;
  iniStructure["FLIGHT_DATA_RECORDER"]["ENABLED"] = idIsEnabled->get() == 1 ? "true" : "false";
  iniStructure["FLIGHT_DATA_RECORDER"]["MAXIMUM_NUMBER_OF_FILES"] = std::to_string(static_cast<int>(idMaximumFileCount->get()));
  iniStructure["FLIGHT_DATA_RECORDER"]["MAXIMUM_NUMBER_OF_ENTRIES_PER_FILE"] =
      std::to_string(static_cast<int>(idMaximumSampleCounter->get()));

  // write file
  iniFile.write(iniStructure, true);
}

void FlightDataRecorder::manageFlightDataRecorderFiles() {
  // increase sample counter
  sampleCounter++;

  // check if file is considered full
  if (sampleCounter >= idMaximumSampleCounter->get()) {
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
  while (files.size() > idMaximumFileCount->get()) {
    bool result = remove(("\\work\\" + files.back()).c_str());
    files.pop_back();
  }
}
