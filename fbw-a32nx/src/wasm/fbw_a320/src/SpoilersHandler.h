#pragma once

#include "RateLimiter.h"

class SpoilersHandler {
 public:
  bool getIsInitialized() const;
  bool getIsArmed() const;
  double getHandlePosition() const;

  void setInitialPosition(bool isArmed, double position);

  void onEventSpoilersOn();
  void onEventSpoilersOff();
  void onEventSpoilersToggle();
  void onEventSpoilersSet(double value);
  void onEventSpoilersAxisSet(double value);

  void onEventSpoilersArmOn();
  void onEventSpoilersArmOff();
  void onEventSpoilersArmToggle();
  void onEventSpoilersArmSet(bool value);

  static constexpr double POSITION_RETRACTED = 0.0;
  static constexpr double POSITION_FULL = 1.0;

  bool isInitialized = false;
  bool isArmed = false;
  double handlePosition = 0.0;
};
