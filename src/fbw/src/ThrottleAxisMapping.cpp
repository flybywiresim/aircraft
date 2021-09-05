#include "ThrottleAxisMapping.h"

#include <cmath>
#include "ini_type_conversion.h"

using namespace std;
using namespace mINI;

ThrottleAxisMapping::ThrottleAxisMapping(unsigned int id) {
  // save id
  this->id = id;

  // update string variables
  string stringId = to_string(id);
  CONFIGURATION_SECTION_AXIS = CONFIGURATION_SECTION_AXIS.append(stringId);
  LVAR_INPUT_VALUE = LVAR_INPUT_VALUE.append(stringId);
  LVAR_THRUST_LEVER_ANGLE = LVAR_THRUST_LEVER_ANGLE.append(stringId);
  LVAR_LOAD_CONFIG = LVAR_LOAD_CONFIG.append(stringId);
  LVAR_USE_REVERSE_ON_AXIS = LVAR_USE_REVERSE_ON_AXIS.append(stringId);
  LVAR_DETENT_REVERSE_LOW = LVAR_DETENT_REVERSE_LOW.append(stringId);
  LVAR_DETENT_REVERSE_HIGH = LVAR_DETENT_REVERSE_HIGH.append(stringId);
  LVAR_DETENT_REVERSEIDLE_LOW = LVAR_DETENT_REVERSEIDLE_LOW.append(stringId);
  LVAR_DETENT_REVERSEIDLE_HIGH = LVAR_DETENT_REVERSEIDLE_HIGH.append(stringId);
  LVAR_DETENT_IDLE_LOW = LVAR_DETENT_IDLE_LOW.append(stringId);
  LVAR_DETENT_IDLE_HIGH = LVAR_DETENT_IDLE_HIGH.append(stringId);
  LVAR_DETENT_CLIMB_LOW = LVAR_DETENT_CLIMB_LOW.append(stringId);
  LVAR_DETENT_CLIMB_HIGH = LVAR_DETENT_CLIMB_HIGH.append(stringId);
  LVAR_DETENT_FLEXMCT_LOW = LVAR_DETENT_FLEXMCT_LOW.append(stringId);
  LVAR_DETENT_FLEXMCT_HIGH = LVAR_DETENT_FLEXMCT_HIGH.append(stringId);
  LVAR_DETENT_TOGA_LOW = LVAR_DETENT_TOGA_LOW.append(stringId);
  LVAR_DETENT_TOGA_HIGH = LVAR_DETENT_TOGA_HIGH.append(stringId);

  // register local variables
  idInputValue = make_unique<LocalVariable>(LVAR_INPUT_VALUE.c_str());
  idThrustLeverAngle = make_unique<LocalVariable>(LVAR_THRUST_LEVER_ANGLE.c_str());
  idUsingConfig = make_unique<LocalVariable>(LVAR_LOAD_CONFIG.c_str());
  idUseReverseOnAxis = make_unique<LocalVariable>(LVAR_USE_REVERSE_ON_AXIS.c_str());
  idDetentReverseLow = make_unique<LocalVariable>(LVAR_DETENT_REVERSE_LOW.c_str());
  idDetentReverseHigh = make_unique<LocalVariable>(LVAR_DETENT_REVERSE_HIGH.c_str());
  idDetentReverseIdleLow = make_unique<LocalVariable>(LVAR_DETENT_REVERSEIDLE_LOW.c_str());
  idDetentReverseIdleHigh = make_unique<LocalVariable>(LVAR_DETENT_REVERSEIDLE_HIGH.c_str());
  idDetentIdleLow = make_unique<LocalVariable>(LVAR_DETENT_IDLE_LOW.c_str());
  idDetentIdleHigh = make_unique<LocalVariable>(LVAR_DETENT_IDLE_HIGH.c_str());
  idDetentClimbLow = make_unique<LocalVariable>(LVAR_DETENT_CLIMB_LOW.c_str());
  idDetentClimbHigh = make_unique<LocalVariable>(LVAR_DETENT_CLIMB_HIGH.c_str());
  idDetentFlexMctLow = make_unique<LocalVariable>(LVAR_DETENT_FLEXMCT_LOW.c_str());
  idDetentFlexMctHigh = make_unique<LocalVariable>(LVAR_DETENT_FLEXMCT_HIGH.c_str());
  idDetentTogaLow = make_unique<LocalVariable>(LVAR_DETENT_TOGA_LOW.c_str());
  idDetentTogaHigh = make_unique<LocalVariable>(LVAR_DETENT_TOGA_HIGH.c_str());
}

void ThrottleAxisMapping::setInFlight() {
  if (!inFlight) {
    inFlight = true;
    setCurrentValue(currentValue);
  }
}

void ThrottleAxisMapping::setOnGround() {
  if (inFlight) {
    inFlight = false;
    setCurrentValue(currentValue);
  }
}

double ThrottleAxisMapping::getValue() {
  return currentValue;
}

double ThrottleAxisMapping::getTLA() {
  return currentTLA;
}

bool ThrottleAxisMapping::loadFromLocalVariables() {
  // get config from local variables and update mapping
  updateMappingFromConfiguration(loadConfigurationFromLocalVariables());
  return true;
}

bool ThrottleAxisMapping::loadFromFile() {
  // create ini file and data structure
  INIStructure iniStructure;
  INIFile iniFile(CONFIGURATION_FILEPATH);

  // read configuration from file or use default
  Configuration configuration;
  if (!iniFile.read(iniStructure)) {
    cout << "WASM: failed to read throttle configuration from disk -> create and use default" << endl;
    configuration = getDefaultConfiguration();
  } else {
    configuration = loadConfigurationFromIniStructure(iniStructure);
  }

  // save values to local variables
  storeConfigurationInLocalVariables(configuration);

  // update configuration
  updateMappingFromConfiguration(configuration);

  // success
  return true;
}

bool ThrottleAxisMapping::saveToFile() {
  // create ini file and data structure
  INIStructure iniStructure;
  INIFile iniFile(CONFIGURATION_FILEPATH);

  // load file
  iniFile.read(iniStructure);

  // set data on structure
  storeConfigurationInIniStructure(iniStructure, loadConfigurationFromLocalVariables());

  // write to file
  return iniFile.write(iniStructure, true);
}

void ThrottleAxisMapping::onEventThrottleSet(long value) {
  // maybe there is a difference between SET and SET_EX1 event -> needs to be checked
  if (!useReverseOnAxis && !isReverseToggleActive) {
    isReverseToggleKeyActive = false;
  }
  setCurrentValue(value / 16384.0);
}

void ThrottleAxisMapping::onEventThrottleFull() {
  setCurrentValue(1.0);
}

void ThrottleAxisMapping::onEventThrottleCut() {
  isReverseToggleActive = false;
  isReverseToggleKeyActive = false;
  setCurrentValue(idleValue);
}

void ThrottleAxisMapping::onEventThrottleIncrease() {
  increaseThrottleBy(0.05);
}

void ThrottleAxisMapping::onEventThrottleIncreaseSmall() {
  increaseThrottleBy(0.025);
}

void ThrottleAxisMapping::onEventThrottleDecrease() {
  decreaseThrottleBy(0.05);
}

void ThrottleAxisMapping::onEventThrottleDecreaseSmall() {
  decreaseThrottleBy(0.025);
}

void ThrottleAxisMapping::onEventThrottleSet_10() {
  setThrottlePercent(10.0);
}

void ThrottleAxisMapping::onEventThrottleSet_20() {
  setThrottlePercent(20.0);
}

void ThrottleAxisMapping::onEventThrottleSet_30() {
  setThrottlePercent(30.0);
}

void ThrottleAxisMapping::onEventThrottleSet_40() {
  setThrottlePercent(40.0);
}

void ThrottleAxisMapping::onEventThrottleSet_50() {
  setThrottlePercent(50.0);
}

void ThrottleAxisMapping::onEventThrottleSet_60() {
  setThrottlePercent(60.0);
}

void ThrottleAxisMapping::onEventThrottleSet_70() {
  setThrottlePercent(70.0);
}

void ThrottleAxisMapping::onEventThrottleSet_80() {
  setThrottlePercent(80.0);
}

void ThrottleAxisMapping::onEventThrottleSet_90() {
  setThrottlePercent(90.0);
}

void ThrottleAxisMapping::onEventReverseToggle() {
  isReverseToggleActive = !isReverseToggleActive;
  isReverseToggleKeyActive = isReverseToggleActive;
  setCurrentValue(idleValue);
}

void ThrottleAxisMapping::onEventReverseHold(bool isButtonHold) {
  isReverseToggleActive = isButtonHold;
  isReverseToggleKeyActive = isReverseToggleActive;
  if (!isReverseToggleActive) {
    setCurrentValue(idleValue);
  }
}

void ThrottleAxisMapping::setThrottlePercent(double value) {
  setCurrentValue(idleValue + (value * (fabs(idleValue - 1) / 100.0)));
}

void ThrottleAxisMapping::setCurrentValue(double value) {
  // calculate new TLA
  double newTLA = 0;
  if (!useReverseOnAxis && (isReverseToggleActive || isReverseToggleKeyActive)) {
    newTLA = (TLA_REVERSE / 2.0) * (value + 1.0);
  } else {
    newTLA = thrustLeverAngleMapping.get(value);
  }

  // ensure not in reverse when in flight
  if (inFlight) {
    newTLA = fmax(TLA_IDLE, newTLA);
  }

  // set values
  currentValue = value;
  currentTLA = newTLA;

  // update local variables
  idInputValue->set(currentValue);
  idThrustLeverAngle->set(currentTLA);
}

void ThrottleAxisMapping::increaseThrottleBy(double value) {
  if (!useReverseOnAxis) {
    // check if we have reached the minimum -> toggle reverse
    if (currentValue == -1.0) {
      isReverseToggleKeyActive = !isReverseToggleKeyActive;
    }
  }
  if (isReverseToggleActive | isReverseToggleKeyActive) {
    setCurrentValue(fmax(-1.0, currentValue - value));
  } else {
    setCurrentValue(fmin(1.0, currentValue + value));
  }
}

void ThrottleAxisMapping::decreaseThrottleBy(double value) {
  if (!useReverseOnAxis) {
    // check if we have reached the minimum -> toggle reverse
    if (currentValue == -1.0) {
      isReverseToggleKeyActive = !isReverseToggleKeyActive;
    }
  }
  if (isReverseToggleActive | isReverseToggleKeyActive) {
    setCurrentValue(fmin(1.0, currentValue + value));
  } else {
    setCurrentValue(fmax(-1.0, currentValue - value));
  }
}

ThrottleAxisMapping::Configuration ThrottleAxisMapping::getDefaultConfiguration() {
  return {
      true,  // use reverse on axis
      -1.00,  // reverse low
      -0.95,  // reverse high
      -0.72,  // reverse idle low
      -0.62,  // reverse idle high
      -0.50,  // idle low
      -0.40,  // idle high
      -0.03,  // climb low
      +0.07,  // climb high
      +0.42,  // flex/mct low
      +0.52,  // flex/mct high
      +0.95,  // toga low
      +1.00   // toga high
  };
}

ThrottleAxisMapping::Configuration ThrottleAxisMapping::loadConfigurationFromLocalVariables() {
  idUsingConfig->set(true);
  return {idUseReverseOnAxis->get() == 1, idDetentReverseLow->get(), idDetentReverseHigh->get(), idDetentReverseIdleLow->get(),
          idDetentReverseIdleHigh->get(), idDetentIdleLow->get(),    idDetentIdleHigh->get(),    idDetentClimbLow->get(),
          idDetentClimbHigh->get(),       idDetentFlexMctLow->get(), idDetentFlexMctHigh->get(), idDetentTogaLow->get(),
          idDetentTogaHigh->get()};
}

void ThrottleAxisMapping::storeConfigurationInLocalVariables(const Configuration& configuration) {
  idUseReverseOnAxis->set(configuration.useReverseOnAxis);
  if (configuration.useReverseOnAxis) {
    idDetentReverseLow->set(configuration.reverseLow);
    idDetentReverseHigh->set(configuration.reverseHigh);
    idDetentReverseIdleLow->set(configuration.reverseIdleLow);
    idDetentReverseIdleHigh->set(configuration.reverseIdleHigh);
  } else {
    idDetentReverseLow->set(0.0);
    idDetentReverseHigh->set(0.0);
    idDetentReverseIdleLow->set(0.0);
    idDetentReverseIdleHigh->set(0.0);
  }
  idDetentIdleLow->set(configuration.idleLow);
  idDetentIdleHigh->set(configuration.idleHigh);
  idDetentClimbLow->set(configuration.climbLow);
  idDetentClimbHigh->set(configuration.climbHigh);
  idDetentFlexMctLow->set(configuration.flxMctLow);
  idDetentFlexMctHigh->set(configuration.flxMctHigh);
  idDetentTogaLow->set(configuration.togaLow);
  idDetentTogaHigh->set(configuration.togaHigh);
}

ThrottleAxisMapping::Configuration ThrottleAxisMapping::loadConfigurationFromIniStructure(const INIStructure& structure) {
  idUsingConfig->set(true);
  return {
      INITypeConversion::getBoolean(structure, CONFIGURATION_SECTION_COMMON, "REVERSE_ON_AXIS", false),
      INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_AXIS, "REVERSE_LOW", -1.00),
      INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_AXIS, "REVERSE_HIGH", -0.95),
      INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_AXIS, "REVERSE_IDLE_LOW", -0.20),
      INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_AXIS, "REVERSE_IDLE_HIGH", -0.15),
      INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_AXIS, "IDLE_LOW", 0.00),
      INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_AXIS, "IDLE_HIGH", 0.05),
      INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_AXIS, "CLIMB_LOW", 0.60),
      INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_AXIS, "CLIMB_HIGH", 0.65),
      INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_AXIS, "FLEX_MCT_LOW", 0.85),
      INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_AXIS, "FLEX_MCT_HIGH", 0.90),
      INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_AXIS, "TOGA_LOW", 0.95),
      INITypeConversion::getDouble(structure, CONFIGURATION_SECTION_AXIS, "TOGA_HIGH", 1.00),
  };
}

void ThrottleAxisMapping::storeConfigurationInIniStructure(INIStructure& structure, const Configuration& configuration) {
  structure[CONFIGURATION_SECTION_COMMON]["REVERSE_ON_AXIS"] = configuration.useReverseOnAxis ? "true" : "false";
  structure[CONFIGURATION_SECTION_AXIS]["REVERSE_LOW"] = to_string(configuration.reverseLow);
  structure[CONFIGURATION_SECTION_AXIS]["REVERSE_HIGH"] = to_string(configuration.reverseHigh);
  structure[CONFIGURATION_SECTION_AXIS]["REVERSE_IDLE_LOW"] = to_string(configuration.reverseIdleLow);
  structure[CONFIGURATION_SECTION_AXIS]["REVERSE_IDLE_HIGH"] = to_string(configuration.reverseIdleHigh);
  structure[CONFIGURATION_SECTION_AXIS]["IDLE_LOW"] = to_string(configuration.idleLow);
  structure[CONFIGURATION_SECTION_AXIS]["IDLE_HIGH"] = to_string(configuration.idleHigh);
  structure[CONFIGURATION_SECTION_AXIS]["CLIMB_LOW"] = to_string(configuration.climbLow);
  structure[CONFIGURATION_SECTION_AXIS]["CLIMB_HIGH"] = to_string(configuration.climbHigh);
  structure[CONFIGURATION_SECTION_AXIS]["FLEX_MCT_LOW"] = to_string(configuration.flxMctLow);
  structure[CONFIGURATION_SECTION_AXIS]["FLEX_MCT_HIGH"] = to_string(configuration.flxMctHigh);
  structure[CONFIGURATION_SECTION_AXIS]["TOGA_LOW"] = to_string(configuration.togaLow);
  structure[CONFIGURATION_SECTION_AXIS]["TOGA_HIGH"] = to_string(configuration.togaHigh);
}

void ThrottleAxisMapping::updateMappingFromConfiguration(const Configuration& configuration) {
  // update use reverse on axis
  useReverseOnAxis = configuration.useReverseOnAxis;

  // mapping table vector
  vector<pair<double, double>> mappingTable;

  if (configuration.useReverseOnAxis) {
    // reverse
    mappingTable.emplace_back(configuration.reverseLow, TLA_REVERSE);
    mappingTable.emplace_back(configuration.reverseHigh, TLA_REVERSE);
    // reverse idle
    mappingTable.emplace_back(configuration.reverseIdleLow, TLA_REVERSE_IDLE);
    mappingTable.emplace_back(configuration.reverseIdleHigh, TLA_REVERSE_IDLE);
  }
  // idle
  mappingTable.emplace_back(configuration.idleLow, TLA_IDLE);
  mappingTable.emplace_back(configuration.idleHigh, TLA_IDLE);
  // climb
  mappingTable.emplace_back(configuration.climbLow, TLA_CLIMB);
  mappingTable.emplace_back(configuration.climbHigh, TLA_CLIMB);
  // flex / mct
  mappingTable.emplace_back(configuration.flxMctLow, TLA_FLEX_MCT);
  mappingTable.emplace_back(configuration.flxMctHigh, TLA_FLEX_MCT);
  // toga
  mappingTable.emplace_back(configuration.togaLow, TLA_TOGA);
  mappingTable.emplace_back(configuration.togaHigh, TLA_TOGA);

  // update interpolation lookup table
  thrustLeverAngleMapping.initialize(mappingTable, useReverseOnAxis ? TLA_REVERSE : TLA_IDLE, TLA_TOGA);

  // remember idle setting
  idleValue = configuration.idleLow;
}
