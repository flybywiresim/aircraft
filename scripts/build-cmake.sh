#!/bin/bash

# This script builds the WASM module for the extra backend with CMake.

# set -x or set -o xtrace expands variables and prints a little + sign before the line.
# set -v or set -o verbose does not expand the variables before printing.
# Use set +x and set +v to turn off the above settings
#set -x

# exit early with status if the script fails
set -e

# get directory of this script relative to root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
pushd "${DIR}" || exit

PARALLEL=8
OUTPUT_DIR="../build/cmake-build-devenv-release/"
CONFIG="Release"
CLEAN=""

# Parse command line arguments
while [ $# -gt 0 ]; do
  case "$1" in
     --debug| -d)
         OUTPUT_DIR="../build/cmake-build-devenv-debug/"
         CONFIG="Debug"
         ;;
     --clean| -c)
         CLEAN="--clean-first"
         ;;
     *)
         echo "Unknown option: $1"
         ;;
  esac
shift
done

# Define a list of directory paths to check if they exist, create if not, and print messages
declare -A directories=(
  ["A32NX_WASM_OUT_DIR"]="../fbw-a32nx/out/flybywire-aircraft-a320-neo/SimObjects/AirPlanes/FlyByWire_A320_NEO/panel"
  ["A380X_WASM_OUT_DIR"]="../fbw-a380x/out/flybywire-aircraft-a380-842/SimObjects/AirPlanes/FlyByWire_A380_842/panel"
  ["FBW_ARINC429_LVAR_BRIDGE_WASM_OUT_DIR"]="../fbw-arinc429-lvar-bridge/out/flybywire-arinc429-lvar-bridge/modules"
)

# Loop over the directory paths to check if they exist, create if not, and print messages
for dir_var in "${!directories[@]}"; do
  dir_path="${directories[$dir_var]}"

  if [ ! -d "$dir_path" ]; then
    echo "$dir_path directory does not exist."
    mkdir -p "$dir_path"
    echo "$dir_path directory created."
  else
    echo "$dir_path directory already exists."
  fi
done


echo "Toolchain versions:"
cmake --version
clang++ --version
wasm-ld --version
echo ""

echo "Building with CMAKE..."
cmake -DCMAKE_TOOLCHAIN_FILE=scripts/cmake/DockerToolchain.cmake -B${OUTPUT_DIR} -DCMAKE_BUILD_TYPE=${CONFIG} ../ || (echo "CMake config failed"; exit 1)
cmake --build ${OUTPUT_DIR} --config ${CONFIG} ${CLEAN} -j ${PARALLEL} || (echo "CMake build failed"; exit 1)
echo ""

echo "WASM module built successfully!"
echo ""
exit 0
