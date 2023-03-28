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
 private:
  std::string_view _simconnectMessage;

 protected:
  InputEventBase(const std::string_view& message) : _simconnectMessage(message) {}

 public:
  InputEventBase(const InputEventBase&) = delete;
  InputEventBase(InputEventBase&&) = delete;
  virtual ~InputEventBase() {}

  /**
   * @brief This function is called as soon as the event is occured
   *
   * @return true The event is processed
   * @return false The event failed
   */
  virtual bool onEventTriggered() = 0;
  /**
   * @brief Returns the SimConnect specific message for the event
   *
   * @return constexpr std::string_view The view on the SimConnect message
   */
  const std::string_view& simconnectMessage() { return this->_simconnectMessage; }
};

class InputEventGroupBase {
  friend Connection;

 protected:
  HANDLE* _connection;
  std::vector<std::shared_ptr<InputEventBase>> _events;
  std::uint32_t _inputId;

  InputEventGroupBase(HANDLE* connection, std::uint32_t inputId) : _connection(connection), _events{}, _inputId(inputId) {}

  bool processEvent(std::uint32_t eventId) {
    const auto groupIdx = (eventId >> 16) & 0xffff;
    const auto eventIdx = eventId & 0xffff;

    if (groupIdx == this->_inputId && eventIdx < this->_events.size()) {
      return this->_events[eventIdx]->onEventTriggered();
    }

    return false;
  }

 public:
  InputEventGroupBase(const InputEventGroupBase&) = delete;
  InputEventGroupBase(InputEventGroupBase&&) = delete;
  virtual ~InputEventGroupBase() {
    this->_connection = nullptr;
    this->_events.clear();
    this->_inputId = 0;
  }

  InputEventGroupBase& operator=(const InputEventGroupBase&) = delete;
  InputEventGroupBase& operator=(InputEventGroupBase&&) = delete;

  bool addEvent(const std::shared_ptr<InputEventBase>& event) {
    // create a global UID for the event
    const std::uint32_t eventId = ((this->_inputId & 0xffff) << 16) | this->_events.size();
    const std::string simconnectMessage(event->simconnectMessage());

    // https://www.fsdeveloper.com/forum/threads/simconnect-mapinputeventtoclientevent-do-not-work.446750/
    auto result = SimConnect_MapClientEventToSimEvent(*this->_connection, eventId, nullptr);
    result |= SimConnect_AddClientEventToNotificationGroup(*this->_connection, this->_inputId, eventId, 0);

    if (SUCCEEDED(result)) {
      std::cout << "TERR ON ND: MAP INPUT" << std::endl;
      result = SimConnect_MapInputEventToClientEvent(*this->_connection, this->_inputId, simconnectMessage.c_str(), eventId);
      if (SUCCEEDED(result)) {
        this->_events.push_back(event);
      }
    }

    return SUCCEEDED(result);
  }

  bool activate() {
    const auto result = SimConnect_SetInputGroupState(*this->_connection, this->_inputId, SIMCONNECT_STATE_ON);
    return SUCCEEDED(result);
  }

  bool deactivate() {
    const auto result = SimConnect_SetInputGroupState(*this->_connection, this->_inputId, SIMCONNECT_STATE_OFF);
    return SUCCEEDED(result);
  }
};

template <std::size_t Priority>
class InputEventGroup : public InputEventGroupBase {
  friend Connection;

 private:
  InputEventGroup(HANDLE* connection, std::uint32_t inputId) : InputEventGroupBase(connection, inputId) {
    SimConnect_SetNotificationGroupPriority(*this->_connection, this->_inputId, Priority);
  }

 public:
  virtual ~InputEventGroup() {}
};

}  // namespace simconnect
