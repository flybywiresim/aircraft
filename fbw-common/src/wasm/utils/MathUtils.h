// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#pragma once

#include <cmath>

#if __cplusplus >= 202002L  // C++20 or greater
#include <numbers>
#else
#include <math.h>
#endif

namespace MathUtils {
#if __cplusplus >= 202002L  // C++20 or greater
static constexpr double PI = std::numbers::pi;
#else
static constexpr double PI = M_PI;
#endif
static constexpr double TWO_PI = 2 * PI;

/**
 * Normalises an angle into the range [0; 360).
 * @param angle The angle in degrees.
 * @returns An equivalent angle in the range [0; 360).
 */
double normalise360(double angle) {
  // this can still be negative..
  const auto mod360 = std::fmod(angle, 360.0);
  // so we force it positive.
  return std::fmod(mod360 + 360.0, 360.0);
}

/**
 * Normalises an angle into the range [-180; 180).
 * @param angle The angle in degrees.
 * @returns An equivalent angle in the range [-180; 180).
 */
double normalise180(double angle) {
  const auto normalised360 = normalise360(angle);

  if (normalised360 >= 180) {
    return normalised360 - 360;
  }

  return normalised360;
}

/**
 * Normalises an angle into the range [0; 2π).
 * @param angle The angle in radians.
 * @returns An equivalent angle in the range [0; 2π).
 */
double normalise2Pi(double angle) {
  // this can still be negative..
  const auto mod2Pi = std::fmod(angle, TWO_PI);
  // so we force it positive.
  return std::fmod(mod2Pi + TWO_PI, TWO_PI);
}

/**
 * Normalises an angle into the range [-π; π).
 * @param angle The angle in radians.
 * @returns An equivalent angle in the range [-π; π).
 */
double normalisePi(double angle) {
  const auto normalised2Pi = normalise2Pi(angle);
  if (normalised2Pi >= PI) {
    return normalised2Pi - TWO_PI;
  }

  return normalised2Pi;
}

/**
 * Corrects an MSFS localiser radial error to give the correct deviations on the back beam.
 * @param radialError Radial error from simvar NAV RADIAL ERROR in degrees.
 * @returns The corrected localiser angular deviation in degrees.
 */
double correctMsfsLocaliserError(double radialError) {
  const auto normalisedError = normalise180(radialError);
  if (normalisedError < -90) {
    return -180 - normalisedError;
  }
  if (normalisedError > 90) {
    return 180 - normalisedError;
  }
  return normalisedError;
}
}  // namespace MathUtils
