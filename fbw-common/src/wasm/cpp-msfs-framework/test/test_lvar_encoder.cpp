// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <cstring>
#include <iostream>
#include <random>

#include "../lib/lvar_encoder.hpp"

int main(int argc, char* argv[]) {
  // Parse arguments
  bool verbose = false;
  for (int i = 1; i < argc; ++i) {
    if (std::strcmp(argv[i], "verbose") == 0) {
      verbose = true;
    }
  }

  // Test parameters
  const int tests       = 1000;
  int       passedTests = 0;

  // Prepare random number generator
  std::random_device              rd;
  std::mt19937                    gen(rd());
  std::uniform_int_distribution<> dis(0, 127);

  // Run tests
  for (int t = 0; t < tests; ++t) {
    // prepare random data
    int8_t original[8];
    for (int8_t& i : original) {
      i = static_cast<int8_t>(dis(gen));  // Generate random int8_t
    }
    while (original[0] > 15) {
      original[0] /= 2;  // Make sure the first parameter is within the 4 bits
    }

    // encode
    double encoded = LVarEncoder::encode8Int8ToDouble(original[0], original[1], original[2], original[3], original[4], original[5],
                                                      original[6], original[7]);

    // test extraction and compare
    bool testPassed = true;
    for (int i = 0; i < 8; ++i) {
      const int64_t decodedValue = LVarEncoder::extract8Int8FromDouble(encoded, i + 1);

      if (verbose) {
        std::cout << "Original " << i << " = " << static_cast<int>(original[i]) << " Extracted: " << decodedValue;
      }

      if (decodedValue != original[i]) {
        if (verbose) {
          std::cout << " - Failed!" << std::endl;
        }
        testPassed = false;
        break;
      }

      if (verbose) {
        std::cout << " - Passed!" << std::endl;
      }
    }
    if (testPassed) {
      passedTests++;
    } else {
      if (verbose) {
        std::cout << "Test " << t + 1 << " failed!" << std::endl;
      }
    }
  }

  // Results
  std::cout << "Passed " << passedTests << " out of " << tests << " tests." << std::endl;
  if (passedTests == tests) {
    std::cout << "All tests passed!" << std::endl;
    return 0;
  } else {
    std::cout << "Some tests failed!" << std::endl;
    return 1;
  }
}
