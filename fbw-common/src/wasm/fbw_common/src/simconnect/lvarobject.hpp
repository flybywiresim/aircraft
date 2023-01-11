#pragma once

#include <SimConnect.h>
#include <chrono>
#include <cstddef>
#include <string_view>
#include <type_traits>
#include <utility>
#include <vector>

#include "../base/changeable.hpp"
#include "../helper/stringconcat.hpp"
#include "../types/quantity.hpp"

namespace simconnect {

class Connection;

class LVarObjectBase : public base::Changeable {
  friend Connection;

 private:
  std::chrono::system_clock::time_point _lastUpdateTime;
  types::Time _updateCycleTime;

 protected:
  LVarObjectBase() : _lastUpdateTime(), _updateCycleTime(-1 * types::millisecond) {}

  bool updateRequired(const std::chrono::system_clock::time_point& now) {
    if (_updateCycleTime.value() < 0.0f) {
      return false;
    }

    types::Time dt = std::chrono::duration_cast<std::chrono::milliseconds>(now - this->_lastUpdateTime).count() * types::millisecond;
    return dt >= this->_updateCycleTime;
  }

  void update(const std::chrono::system_clock::time_point& now) {
    this->_lastUpdateTime = now;
    this->readValues();
  }

  virtual void readValues() = 0;

 public:
  virtual ~LVarObjectBase() {}

  void setUpdateCycleTime(types::Time cycleTime) { this->_updateCycleTime = cycleTime; }
};

template <std::string_view const&... Strings>
class LVarObject : public LVarObjectBase {
 private:
  struct LVarDefinition {
    std::string_view readCommand;
    std::string_view writeCommand;
    double value;
  };

  static constexpr std::string_view CommandSuffix = ", number)";
  static constexpr std::string_view ReadCommandPrefix = "(L:A32NX_";
  static constexpr std::string_view WriteCommandPrefix = " (>L:A32NX_";

  template <std::string_view const& T, std::string_view const&... Ts>
  struct Index;

  template <std::string_view const& T, std::string_view const&... Ts>
  struct Index<T, T, Ts...> : std::integral_constant<std::size_t, 0> {};

  template <std::string_view const& T, std::string_view const& U, std::string_view const&... Ts>
  struct Index<T, U, Ts...> : std::integral_constant<std::size_t, 1 + Index<T, Ts...>::value> {};

  std::vector<LVarDefinition> _entries = {
      {helper::concat<ReadCommandPrefix, Strings, CommandSuffix>, helper::concat<WriteCommandPrefix, Strings, CommandSuffix>, 0.0}...};

  void readValues() override {
    bool changedValues = false;

    for (auto& entry : this->_entries) {
      std::string command = std::string(entry.readCommand);
      double value;

      execute_calculator_code(command.c_str(), &value, nullptr, nullptr);
      if (!helper::Math::almostEqual(value, entry.value)) {
        entry.value = value;
        changedValues = true;
      }
    }

    if (changedValues) {
      this->changed();
    }
  }

 public:
  template <std::string_view const& Name>
  double& value() {
    return this->_entries[LVarObject<Strings...>::Index<Name, Strings...>::value].value;
  }

  template <std::string_view const& Name>
  double value() const {
    return this->_entries[LVarObject<Strings...>::Index<Name, Strings...>::value].value;
  }

  void writeValues() {
    for (const auto& entry : std::as_const(this->_entries)) {
      std::string command = std::to_string(entry.value) + std::string(entry.writeCommand);
      execute_calculator_code(command.c_str(), nullptr, nullptr, nullptr);
    }
  }
};

}  // namespace simconnect
