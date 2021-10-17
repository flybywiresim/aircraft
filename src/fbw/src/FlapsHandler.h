#pragma once

class FlapsHandler {
 public:
  enum HANDLE_POSITION {
    HANDLE_POSITION_FLAPS_0 = 0,
    HANDLE_POSITION_FLAPS_1 = 1,
    HANDLE_POSITION_FLAPS_2 = 2,
    HANDLE_POSITION_FLAPS_3 = 3,
    HANDLE_POSITION_FLAPS_4 = 4,
  };

  enum SIM_POSITION {
    SIM_POSITION_FLAPS_0 = 0,
    SIM_POSITION_FLAPS_1 = 1,
    SIM_POSITION_FLAPS_1F = 2,
    SIM_POSITION_FLAPS_2 = 3,
    SIM_POSITION_FLAPS_3 = 4,
    SIM_POSITION_FLAPS_4 = 5
  };

  bool getIsInitialized() const;
  SIM_POSITION getSimPosition() const;
  HANDLE_POSITION getHandlePosition() const;
  double getHandlePositionPercent() const;

  void setInitialPosition(HANDLE_POSITION position);
  void setAirspeed(double value);
  void onEventFlapsSet(long value);
  void onEventFlapsAxisSet(long value);
  void onEventFlapsIncrease();
  void onEventFlapsDecrease();
  void onEventFlapsUp();
  void onEventFlapsDown();
  void onEventFlapsSet_1();
  void onEventFlapsSet_2();
  void onEventFlapsSet_3();
  void onEventFlapsSet_4();

 private:
  bool isInitialized = false;
  SIM_POSITION simPosition = SIM_POSITION_FLAPS_0;
  HANDLE_POSITION handlePosition = HANDLE_POSITION_FLAPS_0;
  double airspeed = 0;

  HANDLE_POSITION getTargetHandlePosition(double value);
  void updateSimPosition(HANDLE_POSITION targetHandlePosition);
};
