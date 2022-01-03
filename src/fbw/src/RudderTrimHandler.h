#pragma once

#include "RateLimiter.h"

class RudderTrimHandler {
 public:
  RudderTrimHandler();

  void synchronizeValue(double value);

  void onEventRudderTrimLeft(double dt);
  void onEventRudderTrimReset();
  void onEventRudderTrimRight(double dt);
  void onEventRudderTrimSet(double value);

  void update(double dt);
  double getPosition();
  double getTargetPosition();

 private:
  static constexpr double SET_EVENT_DIVIDER = 16384.0;
  static constexpr double POSITION_RESET = 0.0;
  static constexpr double POSITION_MAX_LEFT = -1.0;
  static constexpr double POSITION_MAX_RIGHT = +1.0;
  static constexpr double RATE_LEFT_RIGHT = 0.05;
  static constexpr double RATE_RESET = 0.075;

  double targetValue = 0;
  RateLimiter rateLimiter;
};
