// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <gtest/gtest.h>
#include "fingerprint.hpp"

class FingerprintTest : public ::testing::Test {};

TEST(FingerprintTest, FingerprintFVNReturnsConsistentHashForSameInput) {
  std::vector<int> testVec = {1, 2, 3, 4, 5};
  uint64_t         hash1   = Fingerprint::fingerPrintFVN(testVec);
  uint64_t         hash2   = Fingerprint::fingerPrintFVN(testVec);
  ASSERT_EQ(hash1, hash2);
}

TEST(FingerprintTest, FingerprintFVNDifferentiatesDifferentInputs) {
  std::vector<int> testVec1 = {1, 2, 3, 4, 5};
  std::vector<int> testVec2 = {5, 4, 3, 2, 1};
  ASSERT_NE(Fingerprint::fingerPrintFVN(testVec1), Fingerprint::fingerPrintFVN(testVec2));
}

TEST(FingerprintTest, FingerprintFVNHandlesEmptyVector) {
  std::vector<int> testVec = {};
  ASSERT_NO_THROW(Fingerprint::fingerPrintFVN(testVec));
}

TEST(FingerprintTest, FingerprintFVNHandlesSingleElementVector) {
  std::vector<int> testVec = {1};
  ASSERT_NO_THROW(Fingerprint::fingerPrintFVN(testVec));
}

TEST(FingerprintTest, FingerprintFVNHandlesLargeVector) {
  std::vector<int> testVec(1000000, 1);
  ASSERT_NO_THROW(Fingerprint::fingerPrintFVN(testVec));
}
