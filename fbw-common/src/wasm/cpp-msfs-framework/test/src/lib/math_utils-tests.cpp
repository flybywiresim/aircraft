// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "gtest/gtest.h"
#include "math_utils.hpp"

using helper::Math;

class MathUtilsTest : public ::testing::Test {};

TEST_F(MathUtilsTest, TestAlmostEqual) {
  EXPECT_TRUE(Math::almostEqual(1.0f, 1.0f));
  EXPECT_FALSE(Math::almostEqual(1.0f, 2.0f));
  EXPECT_TRUE(Math::almostEqual(1.0f, 1.00001f, 0.0001f));
  EXPECT_FALSE(Math::almostEqual(1.0f, 1.0001f, 0.0001f));
}

TEST_F(MathUtilsTest, TestAngleAdd) {
  EXPECT_EQ(Math::angleAdd(45.0, 45.0), 90.0);
  EXPECT_EQ(Math::angleAdd(360.0, 45.0), 45.0);
  EXPECT_EQ(Math::angleAdd(-45.0, 45.0), 0.0);
  EXPECT_EQ(Math::angleAdd(-45.0, -45.0), 270.0);
}

TEST_F(MathUtilsTest, TestSign) {
  EXPECT_EQ(Math::sign(10), 1);
  EXPECT_EQ(Math::sign(-10), -1);
  EXPECT_EQ(Math::sign(0), 0);
}
