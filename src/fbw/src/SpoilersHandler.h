#pragma once

class SpoilersHandler {
 public:
  bool getIsInitialized() const;
  bool getIsArmed() const;
  double getHandlePosition() const;
  double getSimPosition() const;
  bool getIsGroundSpoilersActive() const;

  void setInitialPosition(bool isArmed, double position);
  void setSimulationVariables(double simulationTime_new,
                              bool isAutopilotEngaged_new,
                              double groundSpeed_new,
                              double thrustLeverAngle_1_new,
                              double thrustLeverAngle_2_new,
                              double landingGearCompression_1_new,
                              double landingGearCompression_2_new,
                              double flapsHandleIndex_new,
                              bool isAngleOfAttackProtectionActive_new);

  void onEventSpoilersOn();
  void onEventSpoilersOff();
  void onEventSpoilersToggle();
  void onEventSpoilersSet(double value);
  void onEventSpoilersAxisSet(double value);

  void onEventSpoilersArmOn();
  void onEventSpoilersArmOff();
  void onEventSpoilersArmToggle();
  void onEventSpoilersArmSet(bool value);

 private:
  static constexpr double POSITION_RETRACTED = 0.0;
  static constexpr double POSITION_PARTIAL = 0.25;
  static constexpr double POSITION_LIMIT_AUTOPILOT = 0.5;
  static constexpr double POSITION_FULL = 1.0;

  static constexpr double MINIMUM_AIRBORNE_TIME = 5.0;
  static constexpr double CONDITION_GROUND_SPEED = 72.0;

  static constexpr double TLA_IDLE = 0.0;
  static constexpr double TLA_CLB = 25.0;
  static constexpr double TLA_MCT = 35.0;
  static constexpr double TLA_CONDITION_TOUCH_GO = 20.0;

  static constexpr double FLAPS_HANDLE_INDEX_FULL = 5;
  static constexpr double INHIBIT_COOLDOWN_TIME = 10.0;

  bool isInitialized = false;
  bool isArmed = false;
  double handlePosition = 0.0;
  double simPosition = 0.0;

  bool conditionInhibit = false;
  double timeInhibitReset = 0.0;
  bool conditionLanding = false;
  bool conditionTakeOff = false;
  double simulationTime = 0.0;
  double timeAirborne = 0.0;
  bool isAutopilotEngaged = false;
  double groundSpeed = 0.0;
  double thrustLeverAngle_1 = 0.0;
  double thrustLeverAngle_2 = 0.0;
  double landingGearCompression_1 = 0.0;
  double landingGearCompression_2 = 0.0;
  double flapsHandleIndex = 0.0;
  bool isAngleOfAttackProtectionActive = false;

  bool isGroundSpoilersActive = false;

  void update(bool isArmed_new, double handlePosition_new);

  void update(double simulationTime_new,
              bool isArmed_new,
              double handlePosition_new,
              bool isAutopilotEngaged_new,
              double groundSpeed_new,
              double thrustLeverAngle_1_new,
              double thrustLeverAngle_2_new,
              double landingGearCompression_1_new,
              double landingGearCompression_2_new,
              double flapsHandleIndex_new,
              bool isAngleOfAttackProtectionActive_new);

  static double getGearStrutCompressionFromAnimation(double animationPosition);

  static double getTimeSinceAirborne(double simulationTime, double timeAirborne);

  static double numberOfLandingGearsOnGround(double landingGearCompression_1, double landingGearCompression_2);

  static bool areAtOrBelowIdle(double thrustLeverAngle_1, double thrustLeverAngle_2);

  static bool areBelowClimb(double thrustLeverAngle_1, double thrustLeverAngle_2);

  static bool areAboveMct(double thrustLeverAngle_1, double thrustLeverAngle_2);

  static bool isAtLeastOneInReverseAndOtherAtOrBelowIdle(double thrustLeverAngle_1, double thrustLeverAngle_2);

  static bool isAtLeastOneInReverseAndOtherBelowMct(double thrustLeverAngle_1, double thrustLeverAngle_2);
};
