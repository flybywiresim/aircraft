#pragma once

#include <ini.h>
#include <string>

namespace mINI {
class INITypeConversion {
 public:
  INITypeConversion() = delete;

  static bool getBoolean(mINI::INIStructure structure, const std::string& section, const std::string& key, bool defaultValue = false) {
    if (!structure.has(section) || !structure.get(section).has(key)) {
      return defaultValue;
    }
    return getBooleanFromString(structure.get(section).get(key));
  }

  static double getDouble(mINI::INIStructure structure, const std::string& section, const std::string& key, double defaultValue = 0.0) {
    if (!structure.has(section) || !structure.get(section).has(key)) {
      return defaultValue;
    }

    // exceptions are not supported -> need to convert it without
    double value;
    std::stringstream stream(structure.get(section).get(key));
    stream >> value;

    // check if conversion worked
    if (stream.fail()) {
      return defaultValue;
    }
    return value;
  }

  static int getInteger(mINI::INIStructure structure, const std::string& section, const std::string& key, int defaultValue = 0) {
    if (!structure.has(section) || !structure.get(section).has(key)) {
      return defaultValue;
    }

    // exceptions are not supported -> need to convert it without
    int value;
    std::stringstream stream(structure.get(section).get(key));
    stream >> value;

    // check if conversion worked
    if (stream.fail()) {
      return defaultValue;
    }
    return value;
  }

 private:
  static bool getBooleanFromString(const std::string& value) {
    // transform to lower case string
    std::string local = value;
    transform(local.begin(), local.end(), local.begin(), ::tolower);

    if (local == "1" || local == "true" || local == "yes") {
      return true;
    } else {
      return false;
    }
  }
};
};  // namespace mINI
