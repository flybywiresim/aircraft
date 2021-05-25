#pragma once

#include "RateLimiter.h"

class AnimationAileronHandler {
 public:
  AnimationAileronHandler();

  void update(bool autopilotActive,
              bool groundSpoilersActive,
              double pitchAttitudeDegrees,
              double flapsHandleIndex,
              double flapsPosition,
              double position,
              double dt);
  double getPositionLeft();
  double getPositionRight();

 private:
  static constexpr double PITCH_ATTITUDE_REFERENCE = 2.5;
  static constexpr double FLAPS_ANGLE_REFERENCE = 5.0;
  static constexpr double BIAS_DROOP_LEFT = 0.2;
  static constexpr double BIAS_DROOP_RIGHT = -0.2;
  static constexpr double POSITION_ANTI_DROOP_LEFT = -1.0;
  static constexpr double POSITION_ANTI_DROOP_RIGHT = 1.0;
  static constexpr double RATE = 2.00;

  double droopBiasLeft = 0;
  double droopBiasRight = 0;
  double targetValueLeft = 0;
  double targetValueRight = 0;
  RateLimiter rateLimiterLeft;
  RateLimiter rateLimiterRight;
};
