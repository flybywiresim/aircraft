// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include "DampingController.hpp"
#include "gtest/gtest.h"

class DampingControllerTest : public ::testing::Test {};

TEST_F(DampingControllerTest, UpdateSpeedIncreasesValueWhenTargetIsHigher) {
  DampingController dampener{0.0, 0.1, 0.01};
  double            result = dampener.updateTargetValue(1.0);
  EXPECT_NEAR(result, 0.1, 0.01);
}

TEST_F(DampingControllerTest, UpdateSpeedDecreasesValueWhenTargetIsLower) {
  DampingController dampener{1.0, 0.1, 0.01};
  double            result = dampener.updateTargetValue(0.0);
  EXPECT_FLOAT_EQ(result, 0.9);
}

TEST_F(DampingControllerTest, UpdateSpeedReturnsTargetWhenDifferenceIsLessThanEpsilon) {
  DampingController dampener{0.0, 0.1, 0.01};
  double            result = dampener.updateTargetValue(0.005);
  EXPECT_FLOAT_EQ(result, 0.005);
}

TEST_F(DampingControllerTest, UpdateSpeedReturnsSameValueForSameTarget) {
  DampingController dampener{1.0, 0.1, 0.01};
  double            result1 = dampener.updateTargetValue(1.0);
  double            result2 = dampener.updateTargetValue(1.0);
  EXPECT_FLOAT_EQ(result1, result2);
}
