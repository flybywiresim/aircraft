#!/bin/bash

# !!! This file requires LF line endings to be able to run in the docker environment !!!

# Create a build directory
mkdir -p build
cd build

# Run CMake with Debug configuration and compile the project
cmake ..
make -j8

# Run the tests
ctest

# Capture the exit status of ctest
exit_status=$?

# Exit the script with the same status
exit $exit_status
