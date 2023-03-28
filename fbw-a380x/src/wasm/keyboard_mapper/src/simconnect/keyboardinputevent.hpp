#pragma once

#include <array>
#include <string_view>
#include <tuple>
#include <type_traits>

#include "../helper/stringconcat.hpp"
#include "inputevent.hpp"

namespace simconnect {

/**
 * @brief Define all supported keyboard buttons
 */
enum KeyboardButton {
  // alphabetical keys
  KeyA = 0,
  KeyB = 1,
  KeyC = 2,
  KeyD = 3,
  KeyE = 4,
  KeyF = 5,
  KeyG = 6,
  KeyH = 7,
  KeyI = 8,
  KeyJ = 9,
  KeyK = 10,
  KeyL = 11,
  KeyM = 12,
  KeyN = 13,
  KeyO = 14,
  KeyP = 15,
  KeyQ = 16,
  KeyR = 17,
  KeyS = 18,
  KeyT = 19,
  KeyU = 20,
  KeyV = 21,
  KeyW = 22,
  KeyX = 23,
  KeyY = 24,
  KeyZ = 25,
  // numeric keys
  Key0 = 26,
  Key1 = 27,
  Key2 = 28,
  Key3 = 29,
  Key4 = 30,
  Key5 = 31,
  Key6 = 32,
  Key7 = 33,
  Key8 = 34,
  Key9 = 35,
  KeyNumpad0 = 36,
  KeyNumpad1 = 37,
  KeyNumpad2 = 38,
  KeyNumpad3 = 39,
  KeyNumpad4 = 40,
  KeyNumpad5 = 41,
  KeyNumpad6 = 42,
  KeyNumpad7 = 43,
  KeyNumpad8 = 44,
  KeyNumpad9 = 45,
  // special characters
  KeySlash = 46,
  KeyDivide = 47,
  KeyPlus = 48,
  KeyMinus = 49,
  KeySeparator = 50,
  KeyDecimal = 51,
  KeySpace = 52,
  KeyReturn = 53,
  KeyBackspace = 54,
  KeyStandardButtonEnd = 55,
};

/**
 * @brief Base class of keyboard events to validate the constraints defined by SimConnect
 * @tparam ControlKey The number of control keys for the single event
 * @tparam EventNumber The overal number of events for the single event
 */
template <bool ControlKey, std::size_t EventNumber>
class KeyboardEventMetadata {
  static_assert(EventNumber != 0 && ((ControlKey && EventNumber == 1) || (!ControlKey && EventNumber <= 2)), "Invalid event definition");

 public:
  static constexpr bool IsControlKey = ControlKey;
  static constexpr std::size_t EventCount = EventNumber;
};

static constexpr std::string_view MessageConcatinator = "+";

/**
 * @brief Defines the standard keys of the keyboard
 *
 * @tparam Button The button that is used to define the event
 * @tparam LowerCase Indicates if the lower case is used
 * @tparam UpperCase Indicates if the upper case is used
 */
template <KeyboardButton Button>
class KeyboardStandardEvent : public KeyboardEventMetadata<false, 1> {
 private:
  static constexpr std::array<std::string_view, KeyboardButton::KeyStandardButtonEnd> _simconnectTranslation = {{
      "a",          "b",          "c",
      "d",          "e",          "f",
      "g",          "h",          "i",
      "j",          "k",          "l",
      "m",          "n",          "o",
      "p",          "q",          "r",
      "s",          "t",          "u",
      "v",          "w",          "x",
      "y",          "z",          "0",
      "1",          "2",          "3",
      "4",          "5",          "6",
      "7",          "8",          "9",
      "VK_NUMPAD0", "VK_NUMPAD1", "VK_NUMPAD2",
      "VK_NUMPAD3", "VK_NUMPAD4", "VK_NUMPAD5",
      "VK_NUMPAD6", "VK_NUMPAD7", "VK_NUMPAD8",
      "VK_NUMPAD9", "VK_SLASH",   "VK_DIVIDE",
      "VK_PLUS",    "VK_MINUS",   "VK_SEPARATOR",
      "VK_DECIMAL", "Space",      "VK_Enter",
      "Backspace",
  }};

 public:
  /**
   * @brief Contains the view to the SimConnect specific message to use the button in the event
   */
  static constexpr std::string_view simconnectMessage = _simconnectTranslation[Button];
};

/**
 * @brief The keyboard event group with all messages
 *
 * @tparam Events The keyboard buttons that are part of the group
 */
template <typename... Events>
class KeyboardInputEvent : public InputEventBase {
 private:
  template <typename... Args>
  struct CountEvents;
  template <typename Arg, typename... Args>
  struct CountEvents<Arg, Args...> {
    static constexpr auto value = Arg::EventCount + CountEvents<Args...>::value;
  };
  template <typename Arg>
  struct CountEvents<Arg> {
    static constexpr auto value = Arg::EventCount;
  };

  template <typename... Args>
  struct CountControlEvents;
  template <typename Arg, typename... Args>
  struct CountControlEvents<Arg, Args...> {
    static constexpr auto value = (Arg::IsControlKey ? 1 : 0) + CountControlEvents<Args...>::value;
  };
  template <typename Arg>
  struct CountControlEvents<Arg> {
    static constexpr auto value = (Arg::IsControlKey ? 1 : 0);
  };

  static_assert((CountEvents<Events...>::value - CountControlEvents<Events...>::value) <= 2, "Too many events defined");
  static_assert(CountControlEvents<Events...>::value <= 2, "Too many events defined");

  template <typename... Args>
  struct CreateMessage;
  template <typename Arg, typename... Args>
  struct CreateMessage<Arg, Args...> {
    static constexpr auto message = helper::concat<Arg::simconnectMessage, MessageConcatinator, CreateMessage<Args...>::message>;
  };
  template <typename Arg>
  struct CreateMessage<Arg> {
    static constexpr auto message = Arg::simconnectMessage;
  };

 public:
  KeyboardInputEvent() : InputEventBase(CreateMessage<Events...>::message) {}
};

}  // namespace simconnect
