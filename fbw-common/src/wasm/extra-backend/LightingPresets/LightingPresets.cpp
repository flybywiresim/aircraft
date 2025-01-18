// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#include <algorithm>

#include "LightingPresets.h"
#include "ScopedTimer.hpp"
#include "math_utils.hpp"

bool LightingPresets::initialize() {
  dataManager = &msfsHandler.getDataManager();

  // Control LVARs - auto updated with every tick - LOAD/SAVE also auto written to sim
  loadLightingPresetRequest = dataManager->make_named_var("LIGHTING_PRESET_LOAD", UNITS.Number, UpdateMode::AUTO_READ_WRITE);
  saveLightingPresetRequest = dataManager->make_named_var("LIGHTING_PRESET_SAVE", UNITS.Number, UpdateMode::AUTO_READ_WRITE);
  presetLoadTime            = dataManager->make_named_var("LIGHTING_PRESET_LOAD_TIME", UNITS.Number, UpdateMode::AUTO_READ);

  // reset to default values
  loadLightingPresetRequest->setAndWriteToSim(0.0);
  saveLightingPresetRequest->setAndWriteToSim(0.0);
  presetLoadTime->setAndWriteToSim(TOTAL_LOADING_TIME);

  initialize_aircraft();

  _isInitialized = true;
  LOG_INFO("LightingPresets initialized");
  return true;
}

bool LightingPresets::update([[maybe_unused]] sGaugeDrawData* pData) {
  if (!_isInitialized) {
    LOG_ERROR("LightingPresets_A32NX::update() - not initialized");
    return false;
  }
  // only run when aircraft is ready
  if (!msfsHandler.getAircraftIsReadyVar()) {
    LOG_DEBUG("LightingPresets_A32NX::update() - aircraft not ready");
    return true;
  }
  // only run when aircraft is powered
  if (!elecAC1Powered->getAsBool()) {
    LOG_DEBUG("LightingPresets_A32NX::update() - aircraft not powered");
    return true;
  }

  // load has priority in case both vars are set.
  if (const INT64 presetRequest = loadLightingPresetRequest->getAsInt64()) {
    if (readIniFile) {
      LOG_INFO(fmt::format("LightingPresets_A32NX: Lighting Preset: {} is being loaded.", presetRequest));
    }
    // loading a preset happens over a number of frames to allow the animation to keep up
    // loadLightingPreset() returns true when the preset is fully loaded
    // otherwise it returns false and the next frame will continue loading
    if (loadLightingPreset(presetRequest)) {
      readIniFile = true;
      loadLightingPresetRequest->setAsInt64(0);
      LOG_INFO(fmt::format("LightingPresets_A32NX: Lighting Preset: {} successfully loaded.", presetRequest));
    }
  } else if (saveLightingPresetRequest->getAsBool()) {
    saveLightingPreset(saveLightingPresetRequest->getAsInt64());
    saveLightingPresetRequest->setAsInt64(0);
  }

  return true;
}

bool LightingPresets::shutdown() {
  _isInitialized = false;
  LOG_INFO("LightingPresets::shutdown()");
  return true;
}

bool LightingPresets::loadLightingPreset(INT64 loadPresetRequest) {
  // Throttle the load process so animation can keep up
  // Compensates for the fact that the sim runs at different frame rates on different machines
  // Compensation is imperfect as we need a minimum step size to make the values converge and also
  // a maximum step size to avoid the animation being choppy.
  // The reason is that the sim cuts of precision from the LIGHT POTENTIOMETER values we read from
  // the sim so that the values we write back to the sim are not identical to the values we read
  // from the sim.
  const FLOAT64 deltaTime = msfsHandler.getTimeStamp() - lastUpdate;
  if (deltaTime < UPDATE_DELAY_TIME) {
    return false;
  }
  const FLOAT64 partialLoad = presetLoadTime->get() / deltaTime;
  FLOAT64       stepSize    = std::clamp((100 / partialLoad), MIN_STEP_SIZE, MAX_STEP_SIZE);
  lastUpdate                = msfsHandler.getTimeStamp();

  // Read current values to be able to calculate intermediate values which are then applied to the aircraft
  // Once the intermediate values are identical to the target values then the load is finished
  readFromAircraft();
  if (readFromStore(loadPresetRequest)) {
    const bool finished = calculateIntermediateValues(stepSize);
    applyToAircraft();
    return finished;
  }
  LOG_WARN(fmt::format("LightingPresets_A32NX: Loading Lighting Preset: {} failed.", loadPresetRequest));
  return true;
}

void LightingPresets::saveLightingPreset(INT64 savePresetRequest) {
  std::cout << "LightingPresets_A32NX: Save to Lighting Preset: " << savePresetRequest << std::endl;
  readFromAircraft();
  if (saveToStore(savePresetRequest)) {
    LOG_INFO(fmt::format("LightingPresets_A32NX: Lighting Preset: {} successfully saved.", savePresetRequest));
    return;
  }
  LOG_WARN(fmt::format("LightingPresets_A32NX: Saving Lighting Preset: {} failed.", savePresetRequest));
}

bool LightingPresets::readFromStore(INT64 presetNr) {
  // only read ini file from disk if we load a new preset
  if (readIniFile) {
    if (!iniFile.read(ini)) {
      LOG_ERROR("LightingPresets_A32NX: Could not read ini file");
      return false;
    };
    readIniFile = false;
  }
  loadFromIni(ini, fmt::format("preset {}", presetNr));
  return true;
}

bool LightingPresets::saveToStore(INT64 presetNr) {
  // add/update iniSectionName
  const std::string iniSectionName = fmt::format("preset {}", presetNr);
  saveToIni(ini, iniSectionName);
  return iniFile.write(ini, true);
}

AircraftVariablePtr LightingPresets::createLightPotentiometerVar(int index) const {
  return dataManager->make_aircraft_var("LIGHT POTENTIOMETER", index, "", lightPotentiometerSetEvent, UNITS.Percent);
}

FLOAT64 LightingPresets::iniGetOrDefault(const mINI::INIStructure& ini,
                                         const std::string&        section,
                                         const std::string&        key,
                                         const double              defaultValue) {
  if (auto value = ini.get(section).get(key); !value.empty()) {
    // As MSFS wasm does not support exceptions (try/catch) we can't use
    // std::stof here. Workaround with std::stringstreams.
    std::stringstream input(value);
    if (double result; input >> result) {
      return result;
    }
    LOG_WARN(fmt::format("LightingPresets: reading ini value for [{}] {} = {} failed.", section, key, ini.get(section).get(key)));
  }
  return defaultValue;
}

FLOAT64 LightingPresets::convergeValue(FLOAT64 momentary, const FLOAT64 target, FLOAT64 stepSize) {
  FLOAT64 convergedValue;
  if (helper::Math::almostEqual(momentary, target, stepSize)) {
    convergedValue = target;
  } else if (momentary < target) {
    convergedValue = (std::min)(momentary + stepSize, target);
  } else {
    convergedValue = (std::max)(momentary - stepSize, target);
  }
  return convergedValue;
}
