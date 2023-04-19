#pragma once

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wsign-conversion"
#include <SimConnect.h>
#pragma clang diagnostic pop
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

/**
 * @brief The base class to define the named aircraft objects
 */
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

    types::Time dt =
        static_cast<float>(std::chrono::duration_cast<std::chrono::milliseconds>(now - this->_lastUpdateTime).count()) * types::millisecond;
    return dt >= this->_updateCycleTime;
  }

  void update(const std::chrono::system_clock::time_point& now) {
    this->_lastUpdateTime = now;
    this->readValues();
  }

  virtual void readValues() = 0;

 public:
  LVarObjectBase(const LVarObjectBase&) = delete;
  virtual ~LVarObjectBase() override {}

  LVarObjectBase& operator=(const LVarObjectBase&) = delete;

  /**
   * @brief Set the Update Cycle Time that is used to check if variables changed
   * @param cycleTime The time object that needs to pass until variables are read. A negative value disables the updates
   */
  void setUpdateCycleTime(types::Time cycleTime) { this->_updateCycleTime = cycleTime; }
};

/**
 * @brief The named aircraft variable object
 * The implementation adds automatically the correct prefix (i.e. A32NX_)
 * @tparam Strings List of variable names that will be handeled in this object
 */
template <std::string_view const&... Strings>
class LVarObject : public LVarObjectBase {
 private:
  struct LVarDefinition {
    int variableId;
    double value;
  };

  static constexpr std::string_view AircraftPrefix = "A32NX_";

  template <std::string_view const& T, std::string_view const&... Ts>
  struct Index;

  template <std::string_view const& T, std::string_view const&... Ts>
  struct Index<T, T, Ts...> : std::integral_constant<std::size_t, 0> {};

  template <std::string_view const& T, std::string_view const& U, std::string_view const&... Ts>
  struct Index<T, U, Ts...> : std::integral_constant<std::size_t, 1 + Index<T, Ts...>::value> {};

  std::vector<LVarDefinition> _entries;

  void readValues() override {
    bool changedValues = false;

    for (auto& entry : this->_entries) {
      double value = get_named_variable_value(entry.variableId);
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
  /**
   * @brief Construct a new LVarObject object and registered all variable names
   */
  LVarObject() : _entries({{register_named_variable(std::string(helper::concat<AircraftPrefix, Strings>).c_str()), 0.0}...}) {}
  LVarObject(const LVarObject<Strings...>&) = delete;

  LVarObject<Strings...>& operator=(const LVarObject<Strings...>&) = delete;

  /**
   * @brief Returns the modifiable reference to a specific variable
   * @tparam Name The name needs to be an element of Strings...
   * @return double& The reference to the value of Name
   */
  template <std::string_view const& Name>
  double& value() {
    return this->_entries[LVarObject<Strings...>::Index<Name, Strings...>::value].value;
  }

  /**
   * @brief Returns the value to a specific variable
   * @tparam Name The name needs to be an element of Strings...
   * @return double The value of Name
   */
  template <std::string_view const& Name>
  double value() const {
    return this->_entries[LVarObject<Strings...>::Index<Name, Strings...>::value].value;
  }

  /**
   * @brief Writes all values to the simulator
   */
  void writeValues() {
    for (const auto& entry : std::as_const(this->_entries)) {
      set_named_variable_value(entry.variableId, entry.value);
    }
  }
};

}  // namespace simconnect
