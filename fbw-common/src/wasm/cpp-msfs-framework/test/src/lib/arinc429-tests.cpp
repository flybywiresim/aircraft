// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <gtest/gtest.h>
#include "arinc429.hpp"

class Arinc429NumericWordTests : public ::testing::Test {};

TEST_F(Arinc429NumericWordTests, SetFromDataCorrectlySetsRawDataAndSsm) {
  Arinc429NumericWord word;
  word.setFromData(1234.56789, Arinc429SignStatus::FailureWarning);
  ASSERT_FLOAT_EQ(word.value(), 1234.56789);
  ASSERT_EQ(word.ssm(), Arinc429SignStatus::FailureWarning);
}

TEST_F(Arinc429NumericWordTests, SetFromSimVarCorrectlySetsRawDataAndSsm) {
  Arinc429NumericWord word;
  word.setFromData(1234.56789, Arinc429SignStatus::FailureWarning);
  Arinc429NumericWord word2;
  word2.setFromSimVar(word.toSimVar());
  ASSERT_FLOAT_EQ(word.value(), 1234.56789);
  ASSERT_EQ(word.ssm(), Arinc429SignStatus::FailureWarning);
}

TEST_F(Arinc429NumericWordTests, SetFromDataNegativeValue) {
  Arinc429NumericWord word;
  word.setFromData(-1234.56789, Arinc429SignStatus::FailureWarning);
  ASSERT_FLOAT_EQ(word.value(), -1234.56789);
}

class Arinc429DiscreteWordTests : public ::testing::Test {};

TEST_F(Arinc429DiscreteWordTests, BitFromZeroValueReturnsCorrectBit) {
  Arinc429DiscreteWord word;
  word.setFromSimVar(0);
  ASSERT_EQ(word.bitFromValue(1), 0);
  ASSERT_EQ(word.bitFromValue(2), 0);
  ASSERT_EQ(word.bitFromValue(16), 0);
  ASSERT_EQ(word.bitFromValue(31), 0);
  ASSERT_EQ(word.bitFromValue(32), 0);
}

// Test setting and retrieving a specific bit
TEST_F(Arinc429DiscreteWordTests, SetAndGetBit) {
  Arinc429DiscreteWord word;
  // Set the 3rd bit to true
  word.setBit(3, true);
  // Validate if bit is set correctly
  ASSERT_TRUE(word.bitFromValue(3));
  // Set the 3rd bit to false
  word.setBit(3, false);
  // Validate if bit is cleared correctly
  ASSERT_FALSE(word.bitFromValue(3));
}

// Test default value with 'bitFromValueOr'
TEST_F(Arinc429DiscreteWordTests, BitFromValueOr) {
  Arinc429DiscreteWord word;

  // Check default value when SSM is not in NormalOperation or FunctionalTest
  word.setSsm(Arinc429SignStatus::FailureWarning);
  ASSERT_FALSE(word.bitFromValueOr(2, false));
  ASSERT_TRUE(word.bitFromValueOr(2, true));

  // When in NormalOperation, should follow bit state
  word.setSsm(Arinc429SignStatus::NormalOperation);
  word.setBit(2, true);
  ASSERT_TRUE(word.bitFromValueOr(2, false));

  word.setBit(2, false);
  ASSERT_FALSE(word.bitFromValueOr(2, true));
}

// Test behavior with multiple bits set
TEST_F(Arinc429DiscreteWordTests, MultipleBits) {
  Arinc429DiscreteWord word;

  // Set various bits to specific values
  word.setBit(1, true);
  word.setBit(2, false);
  word.setBit(3, true);

  // Validate if the bits are set or cleared correctly
  ASSERT_TRUE(word.bitFromValue(1));
  ASSERT_FALSE(word.bitFromValue(2));
  ASSERT_TRUE(word.bitFromValue(3));
}

#ifdef __cpp_exceptions
// Test behavior when bit number is out of range
TEST_F(Arinc429DiscreteWordTests, OutOfRangeBit) {
  Arinc429DiscreteWord word;
  // Trying to access or set bits out of the expected range (1-32)
  ASSERT_THROW(word.bitFromValue(33), std::out_of_range);
  ASSERT_THROW(word.setBit(33, true), std::out_of_range);
}
#endif
