// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <gtest/gtest.h>
#include "ProfileBuffer.hpp"

class ProfileBufferTest : public ::testing::Test {};

TEST(ProfileBufferTest, PushIncreasesSize) {
  ProfileBuffer<int> buffer(5);
  buffer.push(1);
  ASSERT_EQ(buffer.size(), 1);
  ASSERT_EQ(buffer.capacity(), 5);
}

TEST(ProfileBufferTest, PushRemovesOldestValueWhenFull) {
  ProfileBuffer<int> buffer(2);
  buffer.push(1);
  buffer.push(2);
  buffer.push(3);
  ASSERT_EQ(buffer.size(), 2);
  ASSERT_EQ(buffer.minimum(), 2);
}

TEST(ProfileBufferTest, SumCalculatesCorrectly) {
  ProfileBuffer<int> buffer(3);
  buffer.push(1);
  buffer.push(2);
  buffer.push(3);
  ASSERT_EQ(buffer.sum(), 6);
}

TEST(ProfileBufferTest, AverageCalculatesCorrectly) {
  ProfileBuffer<int> buffer(3);
  buffer.push(1);
  buffer.push(2);
  buffer.push(3);
  ASSERT_EQ(buffer.avg(), 2);
}

TEST(ProfileBufferTest, TrimmedAverageCalculatesCorrectly) {
  ProfileBuffer<int> buffer(5);
  buffer.push(1);
  buffer.push(2);
  buffer.push(3);
  buffer.push(4);
  buffer.push(5);
  ASSERT_EQ(buffer.trimmedAverage(), 3);
}

TEST(ProfileBufferTest, MinimumCalculatesCorrectly) {
  ProfileBuffer<int> buffer(3);
  buffer.push(3);
  buffer.push(1);
  buffer.push(2);
  ASSERT_EQ(buffer.minimum(), 1);
}

TEST(ProfileBufferTest, MaximumCalculatesCorrectly) {
  ProfileBuffer<int> buffer(3);
  buffer.push(1);
  buffer.push(3);
  buffer.push(2);
  ASSERT_EQ(buffer.maximum(), 3);
}

TEST(ProfileBufferTest, SizeReturnsCorrectValue) {
  ProfileBuffer<int> buffer(3);
  buffer.push(1);
  buffer.push(2);
  ASSERT_EQ(buffer.size(), 2);
}

TEST(ProfileBufferTest, CapacityReturnsCorrectValue) {
  ProfileBuffer<int> buffer(3);
  ASSERT_EQ(buffer.capacity(), 3);
}
