#pragma once

#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>

#include <ini.h>
#include <iomanip>
#include <iostream>
#include <memory>
#include <string>

#include "InterpolatingLookupTable.h"
#include "LocalVariable.h"

class ThrottleAxisMapping {
 public:
  ThrottleAxisMapping(unsigned int id);

  void setInFlight();
  void setOnGround();

  double getValue();
  double getTLA();

  bool loadFromLocalVariables();

  bool loadFromFile();
  bool saveToFile();

  void onEventThrottleSet(long value);
  void onEventThrottleFull();
  void onEventThrottleCut();
  void onEventThrottleIncrease();
  void onEventThrottleIncreaseSmall();
  void onEventThrottleDecrease();
  void onEventThrottleDecreaseSmall();
  void onEventThrottleSet_10();
  void onEventThrottleSet_20();
  void onEventThrottleSet_30();
  void onEventThrottleSet_40();
  void onEventThrottleSet_50();
  void onEventThrottleSet_60();
  void onEventThrottleSet_70();
  void onEventThrottleSet_80();
  void onEventThrottleSet_90();
  void onEventReverseToggle();
  void onEventReverseHold(bool isButtonHold);

 private:
  struct Configuration {
    bool useReverseOnAxis;
    double reverseLow;
    double reverseHigh;
    double reverseIdleLow;
    double reverseIdleHigh;
    double idleLow;
    double idleHigh;
    double climbLow;
    double climbHigh;
    double flxMctLow;
    double flxMctHigh;
    double togaLow;
    double togaHigh;
  };

  unsigned int id;

  Configuration getDefaultConfiguration();

  Configuration loadConfigurationFromLocalVariables();
  void storeConfigurationInLocalVariables(const Configuration& configuration);

  Configuration loadConfigurationFromIniStructure(const mINI::INIStructure& structure);
  void storeConfigurationInIniStructure(mINI::INIStructure& structure, const Configuration& configuration);

  void updateMappingFromConfiguration(const Configuration& configuration);

  void setCurrentValue(double value);

  void setThrottlePercent(double value);
  void increaseThrottleBy(double value);
  void decreaseThrottleBy(double value);

  bool useReverseOnAxis = false;

  bool inFlight = false;
  bool isReverseToggleActive = false;
  bool isReverseToggleKeyActive = false;

  double idleValue = 0.0;
  double currentValue = 0.0;
  double currentTLA = 0.0;

  InterpolatingLookupTable thrustLeverAngleMapping;

  std::unique_ptr<LocalVariable> idInputValue;
  std::unique_ptr<LocalVariable> idThrustLeverAngle;

  std::unique_ptr<LocalVariable> idUsingConfig;
  std::unique_ptr<LocalVariable> idUseReverseOnAxis;
  std::unique_ptr<LocalVariable> idDetentReverseLow;
  std::unique_ptr<LocalVariable> idDetentReverseHigh;
  std::unique_ptr<LocalVariable> idDetentReverseIdleLow;
  std::unique_ptr<LocalVariable> idDetentReverseIdleHigh;
  std::unique_ptr<LocalVariable> idDetentIdleLow;
  std::unique_ptr<LocalVariable> idDetentIdleHigh;
  std::unique_ptr<LocalVariable> idDetentClimbLow;
  std::unique_ptr<LocalVariable> idDetentClimbHigh;
  std::unique_ptr<LocalVariable> idDetentFlexMctLow;
  std::unique_ptr<LocalVariable> idDetentFlexMctHigh;
  std::unique_ptr<LocalVariable> idDetentTogaLow;
  std::unique_ptr<LocalVariable> idDetentTogaHigh;

  std::string LVAR_INPUT_VALUE = "A32NX_THROTTLE_MAPPING_INPUT:";
  std::string LVAR_THRUST_LEVER_ANGLE = "A32NX_AUTOTHRUST_TLA:";
  std::string LVAR_LOAD_CONFIG = "A32NX_THROTTLE_MAPPING_LOADED_CONFIG:";
  std::string LVAR_USE_REVERSE_ON_AXIS = "A32NX_THROTTLE_MAPPING_USE_REVERSE_ON_AXIS:";
  std::string LVAR_DETENT_REVERSE_LOW = "A32NX_THROTTLE_MAPPING_REVERSE_LOW:";
  std::string LVAR_DETENT_REVERSE_HIGH = "A32NX_THROTTLE_MAPPING_REVERSE_HIGH:";
  std::string LVAR_DETENT_REVERSEIDLE_LOW = "A32NX_THROTTLE_MAPPING_REVERSE_IDLE_LOW:";
  std::string LVAR_DETENT_REVERSEIDLE_HIGH = "A32NX_THROTTLE_MAPPING_REVERSE_IDLE_HIGH:";
  std::string LVAR_DETENT_IDLE_LOW = "A32NX_THROTTLE_MAPPING_IDLE_LOW:";
  std::string LVAR_DETENT_IDLE_HIGH = "A32NX_THROTTLE_MAPPING_IDLE_HIGH:";
  std::string LVAR_DETENT_CLIMB_LOW = "A32NX_THROTTLE_MAPPING_CLIMB_LOW:";
  std::string LVAR_DETENT_CLIMB_HIGH = "A32NX_THROTTLE_MAPPING_CLIMB_HIGH:";
  std::string LVAR_DETENT_FLEXMCT_LOW = "A32NX_THROTTLE_MAPPING_FLEXMCT_LOW:";
  std::string LVAR_DETENT_FLEXMCT_HIGH = "A32NX_THROTTLE_MAPPING_FLEXMCT_HIGH:";
  std::string LVAR_DETENT_TOGA_LOW = "A32NX_THROTTLE_MAPPING_TOGA_LOW:";
  std::string LVAR_DETENT_TOGA_HIGH = "A32NX_THROTTLE_MAPPING_TOGA_HIGH:";

  const std::string CONFIGURATION_FILEPATH = "\\work\\ThrottleConfiguration.ini";
  const std::string CONFIGURATION_SECTION_COMMON = "THROTTLE_COMMON";
  std::string CONFIGURATION_SECTION_AXIS = "THROTTLE_AXIS_";

  const double TLA_REVERSE = -20.0;
  const double TLA_REVERSE_IDLE = -6.0;
  const double TLA_IDLE = 0.0;
  const double TLA_CLIMB = 25.0;
  const double TLA_FLEX_MCT = 35.0;
  const double TLA_TOGA = 45.0;
};
