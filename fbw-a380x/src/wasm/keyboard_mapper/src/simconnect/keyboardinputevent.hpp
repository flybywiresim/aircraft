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
  KeyAlphabeticalEnd = 26,
  // numeric keys
  Key0 = 30,
  Key1 = 31,
  Key2 = 32,
  Key3 = 33,
  Key4 = 34,
  Key5 = 35,
  Key6 = 36,
  Key7 = 37,
  Key8 = 38,
  Key9 = 39,
  KeyNumericalEnd = 40,
  // special characters
  KeySlash = 50,
  KeyDivide = 51,
  KeyPlus = 52,
  KeyMinus = 53,
  KeySeparator = 54,
  KeyDecimal = 55,
  KeySpace = 56,
  KeyReturn = 57,
  KeyBackspace = 58,
  KeySpecialCharacterEnd = 59,
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

/**
 * @brief Helper structure to estimate the number of event counts for upper and lower cases
 * @tparam Lower Lower case button is used
 * @tparam Upper Upper case button is used
 */
template <bool Lower, bool Upper>
struct KeyboardAlphabeticalEventCount {};
template <>
struct KeyboardAlphabeticalEventCount<false, false> {
  static constexpr std::size_t count = 0;
};
template <>
struct KeyboardAlphabeticalEventCount<true, false> {
  static constexpr std::size_t count = 1;
};
template <>
struct KeyboardAlphabeticalEventCount<false, true> {
  static constexpr std::size_t count = 1;
};
template <>
struct KeyboardAlphabeticalEventCount<true, true> {
  static constexpr std::size_t count = 2;
};
static constexpr std::string_view MessageConcatinator = "+";

/**
 * @brief Defines the alphabetic keys of the keyboard
 *
 * @tparam Button The button that is used to define the event
 * @tparam LowerCase Indicates if the lower case is used
 * @tparam UpperCase Indicates if the upper case is used
 */
template <KeyboardButton Button, bool LowerCase, bool UpperCase>
class KeyboardAlphabeticalEvent : public KeyboardEventMetadata<false, KeyboardAlphabeticalEventCount<LowerCase, UpperCase>::count> {
 private:
  static constexpr std::array<std::tuple<std::string_view, std::string_view>, KeyboardButton::KeyAlphabeticalEnd> _simconnectTranslation = {
      {
          {"A", "a"}, {"B", "b"}, {"C", "c"}, {"D", "d"}, {"E", "e"}, {"F", "f"}, {"G", "g"}, {"H", "h"}, {"I", "i"},
          {"J", "j"}, {"K", "k"}, {"L", "l"}, {"M", "m"}, {"N", "n"}, {"O", "o"}, {"P", "p"}, {"Q", "q"}, {"R", "r"},
          {"S", "s"}, {"T", "t"}, {"U", "u"}, {"V", "v"}, {"W", "w"}, {"X", "x"}, {"Y", "y"}, {"Z", "z"},
      }};

  template <bool Lower, bool Upper>
  struct EventTranslator {};
  template <>
  struct EventTranslator<true, false> {
    static constexpr auto message = std::get<1>(_simconnectTranslation[Button]);
  };
  template <>
  struct EventTranslator<false, true> {
    static constexpr auto message = std::get<0>(_simconnectTranslation[Button]);
  };
  template <>
  struct EventTranslator<true, true> {
    static constexpr auto message =
        helper::concat<EventTranslator<true, false>::message, MessageConcatinator, EventTranslator<false, true>::message>;
  };

 public:
  /**
   * @brief Contains the view to the SimConnect specific message to use the button in the event
   */
  static constexpr std::string_view simconnectMessage = EventTranslator<LowerCase, UpperCase>::message;
};

/**
 * @brief Defines the numerical keys of the keyboard
 *
 * @tparam Button The button that is used to define the event
 * @tparam Numpad Indicates if the numpad number is used
 */
template <KeyboardButton Button, bool Numpad>
class KeyboardNumericalEvent : public KeyboardEventMetadata<false, 1> {
 private:
  static constexpr std::array<std::tuple<std::string_view, std::string_view>, KeyboardButton::KeyNumericalEnd - KeyboardButton::Key0>
      _simconnectTranslation = {{
          {"0", "VK_NUMPAD0"},
          {"1", "VK_NUMPAD1"},
          {"2", "VK_NUMPAD2"},
          {"3", "VK_NUMPAD3"},
          {"4", "VK_NUMPAD4"},
          {"5", "VK_NUMPAD5"},
          {"6", "VK_NUMPAD6"},
          {"7", "VK_NUMPAD7"},
          {"8", "VK_NUMPAD8"},
          {"9", "VK_NUMPAD9"},
      }};

  template <bool IsNumpad>
  struct EventTranslator {};
  template <>
  struct EventTranslator<true> {
    static constexpr auto message = std::get<1>(_simconnectTranslation[Button - KeyboardButton::Key0]);
  };
  template <>
  struct EventTranslator<false> {
    static constexpr auto message = std::get<0>(_simconnectTranslation[Button - KeyboardButton::Key0]);
  };

 public:
  /**
   * @brief Contains the view to the SimConnect specific message to use the button in the event
   */
  static constexpr std::string_view simconnectMessage = EventTranslator<Numpad>::message;
};

/**
 * @brief Defines the special keys of the keyboard
 *
 * @tparam Button The button that is used to define the event
 */
template <KeyboardButton Button>
class KeyboardSpecialCharacterEvent : public KeyboardEventMetadata<false, 1> {
 private:
  static constexpr std::array<std::string_view, KeyboardButton::KeySpecialCharacterEnd - KeyboardButton::KeySlash> _simconnectTranslation =
      {{
          "VK_SLASH",
          "VK_DIVIDE",
          "VK_PLUS",
          "VK_MINUS",
          "VK_SEPARATOR",
          "VK_DECIMAL",
          "Space",
          "VK_Enter",
          "Backspace",
      }};

 public:
  /**
   * @brief Contains the view to the SimConnect specific message to use the button in the event
   */
  static constexpr auto simconnectMessage = _simconnectTranslation[Button - KeyboardButton::KeySlash];
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
