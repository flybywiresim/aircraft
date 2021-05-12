#pragma once

class ElevatorTrimHandler {
 public:
  void synchronizeValue(double value);

  void onEventElevatorTrimUp();
  void onEventElevatorTrimDown();
  void onEventElevatorTrimSet(double value);
  void onEventElevatorTrimAxisSet(double value);

  double getPosition();

 private:
  static constexpr double VALUE_FACTOR = 13.5 / 16384.0;
  static constexpr double POSITION_MAX_UP = 13.5;
  static constexpr double POSITION_MAX_DOWN = -4.0;
  static constexpr double POSITION_INCREMENT = 0.025;

  double targetValue = 0;
};
