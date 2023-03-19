#pragma once

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wsign-conversion"
#pragma clang diagnostic ignored "-Wundef"
#include <SimConnect.h>
#pragma clang diagnostic pop

#include <memory>
#include <string_view>
#include <vector>

namespace simconnect {

class Connection;

/**
 * @brief The base class for the event group of input events
 * This group defines a single event on the SimConnect level, but groups single buttons to one specific event
 * A user of a single event needs to implement the onEventTriggered function.
 */
class InputEventBase {
 protected:
  InputEventBase() {}

  virtual bool onEventTriggered() = 0;

 public:
  InputEventBase(const InputEventBase&) = delete;
  InputEventBase(InputEventBase&&) = delete;
  virtual ~InputEventBase() {}

  /**
   * @brief Returns the SimConnect specific message for the event
   *
   * @return constexpr std::string_view The view on the SimConnect message
   */
  static constexpr std::string_view simconnectMessage() { return ""; }
};

class InputEventGroupBase {
 protected:
  InputEventGroupBase() {}

 public:
  InputEventGroupBase(const InputEventGroupBase&) = delete;
  InputEventGroupBase(InputEventGroupBase&&) = delete;
  virtual ~InputEventGroupBase() {}

  InputEventGroupBase& operator=(const InputEventGroupBase&) = delete;
  InputEventGroupBase& operator=(InputEventGroupBase&&) = delete;
};

template <std::size_t EventCount, std::size_t Priority>
class InputEventGroup : public InputEventGroupBase {
  friend Connection;

 private:
  HANDLE* _connection;
  std::vector<std::shared_ptr<InputEventBase>> _events;
  std::uint32_t _inputId;

  InputEventGroup(HANDLE* connection, std::uint32_t inputId) : _connection(connection), _events{}, _inputId(inputId) {}

 public:
  virtual ~InputEventGroup() {
    this->_connection = nullptr;
    this->_events.clear();
  }

  bool addEvent(const std::shared_ptr<InputEventBase>& event) {
    if (this->_events.size() < EventCount) {
      auto result = SimConnect_MapInputEventToClientEvent(*this->_connection, this->_inputId,
                                                          std::string(event->simconnectMessage()).c_str(), this->_events.size());

      if (S_OK == result) {
        this->_events.push_back(event);
        if (this->_events.size() == EventCount) {
          result = SimConnect_SetInputGroupPriority(*this->_connection, this->_inputId, Priority);
        }
      }

      return S_OK == result;
    }

    return false;
  }
};

}  // namespace simconnect
