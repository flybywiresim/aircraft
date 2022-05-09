#include <filesystem>
#include <iostream>

#include "AdditionalData.h"
#include "AutopilotLaws_types.h"
#include "AutopilotStateMachine_types.h"
#include "Autothrust_types.h"
#include "CommandLine.hpp"
#include "EngineData.h"
#include "FlightDataRecorderConverter.h"
#include "FlyByWire_types.h"
#include "fmt/core.h"
#include "zfstream.h"

using namespace std;

// IMPORTANT: this constant needs to increased with every interface change
const uint64_t INTERFACE_VERSION = 21;

int main(int argc, char* argv[]) {
  // variables for command line parameters
  string inFilePath;
  string outFilePath;
  string delimiter = ",";
  bool noCompression = false;
  bool printStructSize = false;
  bool printGetFileInterfaceVersion = false;
  bool oPrintHelp = false;

  // configuration of command line parameters
  CommandLine args("Converts a32nx fdr files to csv");
  args.addArgument({"-i", "--in"}, &inFilePath, "Input File");
  args.addArgument({"-o", "--out"}, &outFilePath, "Output File");
  args.addArgument({"-d", "--delimiter"}, &delimiter, "Delimiter");
  args.addArgument({"-n", "--no-compression"}, &noCompression, "Input file is not compressed");
  args.addArgument({"-p", "--print-struct-size"}, &printStructSize, "Print struct size");
  args.addArgument({"-g", "--get-input-file-version"}, &printGetFileInterfaceVersion, "Print interface version of input file");
  args.addArgument({"-h", "--help"}, &oPrintHelp, "Print help message");

  // parse command line
  try {
    args.parse(argc, argv);
  } catch (runtime_error const& e) {
    fmt::print("{}\n", e.what());
    return -1;
  }

  // print help
  if (oPrintHelp) {
    args.printHelp();
    cout << endl;
    return 0;
  }

  // print size of struct
  if (printStructSize) {
    fmt::print("Size of struct for reading is '{}' bytes\n", sizeof(fbw_output));
  }

  // check parameters
  if (inFilePath.empty()) {
    fmt::print("Input file parameter missing!\n");
    return 1;
  }
  if (!filesystem::exists(inFilePath)) {
    fmt::print("Input file does not exist!\n");
    return 1;
  }
  if (outFilePath.empty() && !printGetFileInterfaceVersion) {
    fmt::print("Output file parameter missing!\n");
    return 1;
  }

  // create input stream
  istream* in;
  if (!noCompression) {
    in = new gzifstream(inFilePath.c_str());
  } else {
    in = new ifstream(inFilePath.c_str(), ios::in | ios::binary);
  }

  // check if stream is ok
  if (!in->good()) {
    fmt::print("Failed to open input file!\n");
    return 1;
  }

  // read file version
  uint64_t fileFormatVersion = {};
  in->read(reinterpret_cast<char*>(&fileFormatVersion), sizeof(INTERFACE_VERSION));

  // print file version if requested and return
  if (printGetFileInterfaceVersion) {
    cout << fileFormatVersion << endl;
    return 0;
  } else if (INTERFACE_VERSION != fileFormatVersion) {
    fmt::print("ERROR: mismatch between converter and file version (expected {}, got {})\n", INTERFACE_VERSION, fileFormatVersion);
    return 1;
  }

  // print information on convert
  fmt::print("Converting from '{}' to '{}' with interface version '{}' and delimiter '{}'\n", inFilePath, outFilePath, fileFormatVersion,
             delimiter);

  // output stream
  ofstream out;
  // open the output file
  out.open(outFilePath, ios::out | ios::trunc);
  // check if file is open
  if (!out.is_open()) {
    fmt::print("Failed to create output file!\n");
    return 1;
  }

  // write header
  FlightDataRecorderConverter::writeHeader(out, delimiter);

  // calculate number of entries
  auto counter = 0;
  auto numberOfEntries = filesystem::file_size(inFilePath) / sizeof(fbw_output);

  // struct for reading
  ap_sm_output data_ap_sm = {};
  ap_raw_output data_ap_laws = {};
  athr_out data_athr = {};
  fbw_output data_fbw = {};
  EngineData data_engine = {};
  AdditionalData data_additional = {};

  // read one struct from the file
  while (!in->eof()) {
    // read data into structs
    in->read(reinterpret_cast<char*>(&data_ap_sm), sizeof(ap_sm_output));
    in->read(reinterpret_cast<char*>(&data_ap_laws), sizeof(ap_raw_output));
    in->read(reinterpret_cast<char*>(&data_athr), sizeof(athr_out));
    in->read(reinterpret_cast<char*>(&data_fbw), sizeof(fbw_output));
    in->read(reinterpret_cast<char*>(&data_engine), sizeof(EngineData));
    in->read(reinterpret_cast<char*>(&data_additional), sizeof(AdditionalData));
    // write struct to csv file
    FlightDataRecorderConverter::writeStruct(out, delimiter, data_ap_sm, data_ap_laws, data_athr, data_fbw, data_engine, data_additional);
    // print progress
    if (++counter % 1000 == 0) {
      fmt::print("Processed {} entries...\r", counter);
    }
  }

  // print final value
  fmt::print("Processed {} entries...\n", counter);

  // success
  return 0;
}
