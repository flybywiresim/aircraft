// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "gtest/gtest.h"
#include "string_utils.hpp"

using helper::StringUtils;

class StringUtilsTest : public ::testing::Test {};

TEST_F(StringUtilsTest, TestInsertThousandsSeparator) {
  EXPECT_EQ(StringUtils::insertThousandsSeparator(1000), "1,000");
  EXPECT_EQ(StringUtils::insertThousandsSeparator(-1000), "-1,000");
  EXPECT_EQ(StringUtils::insertThousandsSeparator(1234567890, "."), "1.234.567.890");
}

TEST_F(StringUtilsTest, TestToStringWithZeroPadding) {
  EXPECT_EQ(StringUtils::to_string_with_zero_padding(5, 3), "005");
  EXPECT_EQ(StringUtils::to_string_with_zero_padding(-5, 3), "-005");
}

TEST_F(StringUtilsTest, TestSplitFast) {
  std::vector<std::string> result;
  StringUtils::splitFast(std::string("Hello World"), result);
  EXPECT_EQ(result[0], "Hello");
  EXPECT_EQ(result[1], "World");
  result.clear();
  StringUtils::splitFast(std::string("This;is;a;test!"), result, ";");
  EXPECT_EQ(result[0], "This");
  EXPECT_EQ(result[1], "is");
  EXPECT_EQ(result[2], "a");
  EXPECT_EQ(result[3], "test!");
  result.clear();
  StringUtils::splitFast("This;:is;:a;:test!", result, ";:");
  EXPECT_EQ(result[0], "This");
  EXPECT_EQ(result[1], "is");
  EXPECT_EQ(result[2], "a");
  EXPECT_EQ(result[3], "test!");
}

TEST_F(StringUtilsTest, TestTrimFast) {
  EXPECT_EQ(StringUtils::trimFast(std::string("   Hello World   ")), "Hello World");
  EXPECT_EQ(StringUtils::trimFast(std::string("\tHello World\n\n")), "Hello World");
}

TEST_F(StringUtilsTest, TestRemoveTrailingComments) {
  EXPECT_EQ(StringUtils::removeTrailingComments(std::string("Hello World // Comment"), "//"), "Hello World ");
  EXPECT_EQ(StringUtils::removeTrailingComments(std::string("Hello World // ; Comment"), ";"), "Hello World // ");
}

TEST_F(StringUtilsTest, TestToLowerCase) {
  EXPECT_EQ(StringUtils::toLowerCase("HELLO WORLD"), "hello world");
}

TEST_F(StringUtilsTest, TestToUpperCase) {
  EXPECT_EQ(StringUtils::toUpperCase("hello world"), "HELLO WORLD");
}

TEST(StringUtilsTests, StrBitsGroupedReturnsCorrectStringForZero) {
  uint64_t    input    = 0;
  std::string expected = "00000000.00000000.00000000.00000000.00000000.00000000.00000000.00000000 (0)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedInteger(input), expected);
}

TEST(StringUtilsTests, StrBitsGroupedReturnsCorrectStringForMaxUint64) {
  uint64_t    input    = UINT64_MAX;
  std::string expected = "11111111.11111111.11111111.11111111.11111111.11111111.11111111.11111111 (18446744073709551615)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedInteger(input), expected);
}

TEST(StringUtilsTests, LeastSignificantBitReturnsCorrectBitForZero) {
  uint64_t    input    = 0b0000000000000000000000000000000000000000000000000000000000000001;
  std::string expected = "00000000.00000000.00000000.00000000.00000000.00000000.00000000.00000001 (1)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedInteger(input), expected);
}

TEST(StringUtilsTests, MostSignificantBitReturnsCorrectBitForZero) {
  uint64_t    input    = 0b1000000000000000000000000000000000000000000000000000000000000000;
  std::string expected = "10000000.00000000.00000000.00000000.00000000.00000000.00000000.00000000 (9223372036854775808)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedInteger(input), expected);
}

TEST(StringUtilsTests, Pattern64BitReturnsCorrectBitForZero) {
  uint64_t    input    = 0b1010101010101010101010101010101010101010101010101010101010101010;
  std::string expected = "10101010.10101010.10101010.10101010.10101010.10101010.10101010.10101010 (12297829382473034410)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedInteger(input), expected);
}

TEST(StringUtilsTests, Pattern32BitReturnsCorrectBitForZero) {
  uint32_t    input    = 0b10101010101010101010101010101010;
  std::string expected = "10101010.10101010.10101010.10101010 (2863311530)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedInteger(input), expected);
}

TEST(StringUtilsTests, Pattern16BitReturnsCorrectBitForZero) {
  uint16_t    input    = 0b1010101010101010;
  std::string expected = "10101010.10101010 (43690)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedInteger(input), expected);
}

TEST(StringUtilsTests, Pattern8BitReturnsCorrectBitForZero) {
  uint8_t     input    = 0b10101010;
  std::string expected = "10101010 (170)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedInteger(input), expected);
}

// Floating point tests

TEST(StringUtilsTests, StrBitsGroupedFloatingpointReturnsCorrectStringForZero) {
  double      input    = 0.0;
  std::string expected = "0.00000000000.0000000000000000000000000000000000000000000000000000 (0)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedFloatingpoint(input), expected);
}

TEST(StringUtilsTests, StrBitsGroupedFloatingpointReturnsCorrectStringForOne) {
  double      input    = 1.0;
  std::string expected = "0.01111111111.0000000000000000000000000000000000000000000000000000 (1)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedFloatingpoint(input), expected);
}

TEST(StringUtilsTests, StrBitsGroupedFloatingpointReturnsCorrectStringForMinusOne) {
  double      input    = -1.0;
  std::string expected = "1.01111111111.0000000000000000000000000000000000000000000000000000 (-1)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedFloatingpoint(input), expected);
}

TEST(StringUtilsTests, StrBitsGroupedFloatingpointReturnsCorrectStringForHalf) {
  double      input    = 0.5;
  std::string expected = "0.01111111110.0000000000000000000000000000000000000000000000000000 (0.5)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedFloatingpoint(input), expected);
}

TEST(StringUtilsTests, StrBitsGroupedFloatingpointReturnsCorrectStringForTwo) {
  double      input    = 2.0;
  std::string expected = "0.10000000000.0000000000000000000000000000000000000000000000000000 (2)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedFloatingpoint(input), expected);
}

TEST(StringUtilsTests, StrBitsGroupedFloatingpointReturnsCorrectStringForSmallNumber) {
  double      input    = 0.1;
  std::string expected = "0.01111111011.1001100110011001100110011001100110011001100110011010 (0.10000000000000001)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedFloatingpoint(input), expected);
}

// Test cases for floating-point numbers
TEST(StringUtilsTests, StrBitsGroupedFloatingpoint2ReturnsCorrectStringForZero) {
  float       input    = 0.0f;
  std::string expected = "0.00000000.00000000000000000000000 (0)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedFloatingpoint(input), expected);
}

TEST(StringUtilsTests, StrBitsGroupedFloatingpoint2ReturnsCorrectStringForOne) {
  float       input    = 1.0f;
  std::string expected = "0.01111111.00000000000000000000000 (1)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedFloatingpoint(input), expected);
}

TEST(StringUtilsTests, StrBitsGroupedFloatingpoint2ReturnsCorrectStringForMinusOne) {
  float       input    = -1.0f;
  std::string expected = "1.01111111.00000000000000000000000 (-1)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedFloatingpoint(input), expected);
}

TEST(StringUtilsTests, StrBitsGroupedFloatingpoint2ReturnsCorrectStringForHalf) {
  float       input    = 0.5f;
  std::string expected = "0.01111110.00000000000000000000000 (0.5)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedFloatingpoint(input), expected);
}

TEST(StringUtilsTests, StrBitsGroupedFloatingpoint2ReturnsCorrectStringForTwo) {
  float       input    = 2.0f;
  std::string expected = "0.10000000.00000000000000000000000 (2)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedFloatingpoint(input), expected);
}

TEST(StringUtilsTests, StrBitsGroupedFloatingpoint2ReturnsCorrectStringForSmallNumber) {
  float       input    = 0.1f;
  std::string expected = "0.01111011.10011001100110011001101 (0.10000000149011612)";
  ASSERT_EQ(helper::StringUtils::strBitsGroupedFloatingpoint(input), expected);
}
