// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
#include <gtest/gtest.h>
#include "quantity.hpp"

class QuantityTest : public ::testing::Test {};

// Test default constructor and explicit constructor
TEST(QuantityTest, DefaultAndExplicitConstructor) {
  Mass m1;  // Default constructor
  EXPECT_FLOAT_EQ(m1.value(), 0.0f);

  Mass m2(10.0f);  // Explicit constructor
  EXPECT_FLOAT_EQ(m2.value(), 10.0f);
}

// Test addition
TEST(QuantityTest, Addition) {
  Mass m1(5.0f);
  Mass m2(10.0f);

  Mass m3 = m1 + m2;
  EXPECT_FLOAT_EQ(m3.value(), 15.0f);

  m1 += m2;
  EXPECT_FLOAT_EQ(m1.value(), 15.0f);
}

// Test subtraction
TEST(QuantityTest, Subtraction) {
  Mass m1(15.0f);
  Mass m2(10.0f);

  Mass m3 = m1 - m2;
  EXPECT_FLOAT_EQ(m3.value(), 5.0f);

  m1 -= m2;
  EXPECT_FLOAT_EQ(m1.value(), 5.0f);
}

// Test multiplication with and without units
TEST(QuantityTest, Multiplication) {
  Mass m1(5.0f);
  Mass m2 = m1 * 2.0f;

  EXPECT_FLOAT_EQ(m2.value(), 10.0f);

  Length   l1(3.0f);
  Velocity v1 = l1 / Time(2.0f);

  EXPECT_FLOAT_EQ(v1.value(), 1.5f);

  v1 = 2.0f * v1;
  EXPECT_FLOAT_EQ(v1.value(), 3.0f);
}

// Test division with and without units
TEST(QuantityTest, Division) {
  Mass m1(10.0f);
  Mass m2 = m1 / 2.0f;

  EXPECT_FLOAT_EQ(m2.value(), 5.0f);

  Velocity v1(20.0f);
  Time     t1 = v1 / Acceleration(2.0f);

  EXPECT_FLOAT_EQ(t1.value(), 10.0f);

  v1 = v1 / 2.0f;
  EXPECT_FLOAT_EQ(v1.value(), 10.0f);
}

// Test comparison operators
TEST(QuantityTest, Comparison) {
  Mass m1(5.0f);
  Mass m2(10.0f);
  Mass m3(5.0f);

  EXPECT_TRUE(m1 < m2);
  EXPECT_TRUE(m1 <= m2);
  EXPECT_TRUE(m1 <= m3);
  EXPECT_TRUE(m2 > m1);
  EXPECT_TRUE(m2 >= m1);
  EXPECT_TRUE(m3 == m1);
  EXPECT_TRUE(m2 != m1);
}

// Test conversion
TEST(QuantityTest, Convert) {
  Length l1(1000.0f);  // in meters
  Length l2(1.0f);     // in kilometers

  EXPECT_FLOAT_EQ(l1.convert(l2), 1000.0f);
}

// Test user-defined literals
TEST(QuantityTest, UserDefinedLiterals) {
  Mass m1 = 5.0_kg;
  EXPECT_FLOAT_EQ(m1.value(), 5.0f);

  Length l1 = 3.0_m;
  EXPECT_FLOAT_EQ(l1.value(), 3.0f);

  Time t1 = 1.0_min;
  EXPECT_FLOAT_EQ(t1.value(), 60.0f);

  Velocity v1 = 20.0_kmph;
  EXPECT_FLOAT_EQ(v1.value(), 20.0f * 1000.0f / 3600.0f);  // Conversion to m/s
}

// Test absolute value
TEST(QuantityTest, Absolute) {
  Mass m1(-10.0f);
  Mass m2 = m1.abs();

  EXPECT_FLOAT_EQ(m2.value(), 10.0f);
}

TEST(AccelerationTest, DefaultConstructor) {
  Acceleration a;
  EXPECT_FLOAT_EQ(a.value(), 0.0f);
}

TEST(AccelerationTest, ValueConstructor) {
  Acceleration a(9.8f);
  EXPECT_FLOAT_EQ(a.value(), 9.8f);
}

TEST(AccelerationTest, Addition) {
  Acceleration a1(9.8f);
  Acceleration a2(1.2f);
  a1 += a2;
  EXPECT_FLOAT_EQ(a1.value(), 11.0f);
}

TEST(AccelerationTest, Subtraction) {
  Acceleration a1(9.8f);
  Acceleration a2(1.2f);
  a1 -= a2;
  EXPECT_FLOAT_EQ(a1.value(), 8.6f);
}

TEST(AccelerationTest, MultiplicationWithScalar) {
  Acceleration a(9.8f);
  a = a * 2.0f;
  EXPECT_FLOAT_EQ(a.value(), 19.6f);
}

TEST(AccelerationTest, DivisionWithScalar) {
  Acceleration a(9.8f);
  a = a / 2.0f;
  EXPECT_FLOAT_EQ(a.value(), 4.9f);
}

TEST(AccelerationTest, Equality) {
  Acceleration a1(9.8f);
  Acceleration a2(9.8f);
  EXPECT_TRUE(a1 == a2);
}

TEST(AccelerationTest, Inequality) {
  Acceleration a1(9.8f);
  Acceleration a2(1.2f);
  EXPECT_TRUE(a1 != a2);
}

TEST(AccelerationTest, LessThan) {
  Acceleration a1(9.8f);
  Acceleration a2(1.2f);
  EXPECT_TRUE(a2 < a1);
}

TEST(AccelerationTest, GreaterThan) {
  Acceleration a1(9.8f);
  Acceleration a2(1.2f);
  EXPECT_TRUE(a1 > a2);
}

TEST(AccelerationVelocityTimeRelationTest, VelocityAfterAcceleration) {
  // Initial velocity (u)
  Velocity u(0.0f);

  // Acceleration (a)
  Acceleration a(9.8f);

  // Time (t)
  Time t(2.0f);

  // Calculate final velocity (v = u + at)
  Velocity v = u + a * t;

  // Check if the final velocity is as expected
  EXPECT_FLOAT_EQ(v.value(), 19.6f);
}

TEST(AccelerationVelocityTimeRelationTest, DistanceTravelledAfterAcceleration) {
  // Initial velocity (u)
  Velocity u(0.0f);

  // Acceleration (a)
  Acceleration a(9.8f);

  // Time (t)
  Time t(2.0f);

  // Calculate distance travelled (s = ut + 0.5 * at^2)
  Length s = u * t + 0.5f * a * t * t;

  // Check if the distance travelled is as expected
  EXPECT_FLOAT_EQ(s.value(), 19.6f);
}
