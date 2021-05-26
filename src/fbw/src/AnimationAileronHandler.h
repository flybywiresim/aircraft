#pragma once

#include "RateLimiter.h"

class AnimationAileronHandler {
 public:
  AnimationAileronHandler();

  void update(bool autopilotActive,
              bool groundSpoilersActive,
              double simulationTime,
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

  static constexpr double DROOP_RATE = 0.25;
  static constexpr double DROOP_TIME_SWITCH = 2.0;
  static constexpr double DROOP_BIAS_OFF = 0.0;
  static constexpr double DROOP_BIAS_ON = 0.2;
  static constexpr double ANTI_DROOP_RATE = 1.0;
  static constexpr double ANTI_DROOP_BIAS_OFF = 0.0;
  static constexpr double ANTI_DROOP_BIAS_ON = -1.2;

  bool antiDroopInhibited = false;
  bool areGroundSpoilersActive = false;

  double eventTime = 0;

  double lastFlapsPosition = 0;
  double targetValueDroop = DROOP_BIAS_OFF;

  RateLimiter rateLimiterLeft;
  RateLimiter rateLimiterRight;
  RateLimiter rateLimiterDroop;
  RateLimiter rateLimiterAntiDroop;
};
