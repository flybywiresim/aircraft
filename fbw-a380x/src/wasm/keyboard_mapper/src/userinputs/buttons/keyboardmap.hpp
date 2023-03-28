#pragma once

#include <string_view>

#include "../../simconnect/keyboardinputevent.hpp"

namespace userinputs {

template <simconnect::KeyboardButton Button, std::string_view const& Value>
struct Entry {
  static constexpr simconnect::KeyboardButton key = Button;
  static constexpr std::string_view value = Value;
};

template <typename...>
struct Map;

template <>
struct Map<> {
  template <simconnect::KeyboardButton>
  struct get {
    static constexpr std::string_view value = "";
  };
};

template <simconnect::KeyboardButton Button, std::string_view const& Value, typename... Rest>
struct Map<Entry<Button, Value>, Rest...> {
  template <simconnect::KeyboardButton Key>
  struct get {
    static constexpr std::string_view value = (Key == Button) ? Value : Map<Rest...>::template get<Key>::value;
  };
};

static constexpr std::string_view _fbwButtonA = "A";
static constexpr std::string_view _fbwButtonB = "B";
static constexpr std::string_view _fbwButtonC = "C";
static constexpr std::string_view _fbwButtonD = "D";
static constexpr std::string_view _fbwButtonE = "E";
static constexpr std::string_view _fbwButtonF = "F";
static constexpr std::string_view _fbwButtonG = "G";
static constexpr std::string_view _fbwButtonH = "H";
static constexpr std::string_view _fbwButtonI = "I";
static constexpr std::string_view _fbwButtonJ = "J";
static constexpr std::string_view _fbwButtonK = "K";
static constexpr std::string_view _fbwButtonL = "L";
static constexpr std::string_view _fbwButtonM = "M";
static constexpr std::string_view _fbwButtonN = "N";
static constexpr std::string_view _fbwButtonO = "O";
static constexpr std::string_view _fbwButtonP = "P";
static constexpr std::string_view _fbwButtonQ = "Q";
static constexpr std::string_view _fbwButtonR = "R";
static constexpr std::string_view _fbwButtonS = "S";
static constexpr std::string_view _fbwButtonT = "T";
static constexpr std::string_view _fbwButtonU = "U";
static constexpr std::string_view _fbwButtonV = "V";
static constexpr std::string_view _fbwButtonW = "W";
static constexpr std::string_view _fbwButtonX = "X";
static constexpr std::string_view _fbwButtonY = "Y";
static constexpr std::string_view _fbwButtonZ = "Z";
static constexpr std::string_view _fbwButton0 = "0";
static constexpr std::string_view _fbwButton1 = "1";
static constexpr std::string_view _fbwButton2 = "2";
static constexpr std::string_view _fbwButton3 = "3";
static constexpr std::string_view _fbwButton4 = "4";
static constexpr std::string_view _fbwButton5 = "5";
static constexpr std::string_view _fbwButton6 = "6";
static constexpr std::string_view _fbwButton7 = "7";
static constexpr std::string_view _fbwButton8 = "8";
static constexpr std::string_view _fbwButton9 = "9";
static constexpr std::string_view _fbwButtonSlash = "SLASH";
static constexpr std::string_view _fbwButtonPlusMinus = "PLUSMINUS";
static constexpr std::string_view _fbwButtonDot = "DOT";
static constexpr std::string_view _fbwButtonSpace = "SP";
static constexpr std::string_view _fbwButtonReturn = "ENT";
static constexpr std::string_view _fbwButtonBackspace = "BACKSPACE";

using KeyboardMap = Map<Entry<simconnect::KeyboardButton::KeyA, _fbwButtonA>,
                        Entry<simconnect::KeyboardButton::KeyB, _fbwButtonB>,
                        Entry<simconnect::KeyboardButton::KeyC, _fbwButtonC>,
                        Entry<simconnect::KeyboardButton::KeyD, _fbwButtonD>,
                        Entry<simconnect::KeyboardButton::KeyE, _fbwButtonE>,
                        Entry<simconnect::KeyboardButton::KeyF, _fbwButtonF>,
                        Entry<simconnect::KeyboardButton::KeyG, _fbwButtonG>,
                        Entry<simconnect::KeyboardButton::KeyH, _fbwButtonH>,
                        Entry<simconnect::KeyboardButton::KeyI, _fbwButtonI>,
                        Entry<simconnect::KeyboardButton::KeyJ, _fbwButtonJ>,
                        Entry<simconnect::KeyboardButton::KeyK, _fbwButtonK>,
                        Entry<simconnect::KeyboardButton::KeyL, _fbwButtonL>,
                        Entry<simconnect::KeyboardButton::KeyM, _fbwButtonM>,
                        Entry<simconnect::KeyboardButton::KeyN, _fbwButtonN>,
                        Entry<simconnect::KeyboardButton::KeyO, _fbwButtonO>,
                        Entry<simconnect::KeyboardButton::KeyP, _fbwButtonP>,
                        Entry<simconnect::KeyboardButton::KeyQ, _fbwButtonQ>,
                        Entry<simconnect::KeyboardButton::KeyR, _fbwButtonR>,
                        Entry<simconnect::KeyboardButton::KeyS, _fbwButtonS>,
                        Entry<simconnect::KeyboardButton::KeyT, _fbwButtonT>,
                        Entry<simconnect::KeyboardButton::KeyU, _fbwButtonU>,
                        Entry<simconnect::KeyboardButton::KeyV, _fbwButtonV>,
                        Entry<simconnect::KeyboardButton::KeyW, _fbwButtonW>,
                        Entry<simconnect::KeyboardButton::KeyX, _fbwButtonX>,
                        Entry<simconnect::KeyboardButton::KeyY, _fbwButtonY>,
                        Entry<simconnect::KeyboardButton::KeyZ, _fbwButtonZ>,
                        Entry<simconnect::KeyboardButton::Key0, _fbwButton0>,
                        Entry<simconnect::KeyboardButton::Key1, _fbwButton1>,
                        Entry<simconnect::KeyboardButton::Key2, _fbwButton2>,
                        Entry<simconnect::KeyboardButton::Key3, _fbwButton3>,
                        Entry<simconnect::KeyboardButton::Key4, _fbwButton4>,
                        Entry<simconnect::KeyboardButton::Key5, _fbwButton5>,
                        Entry<simconnect::KeyboardButton::Key6, _fbwButton6>,
                        Entry<simconnect::KeyboardButton::Key7, _fbwButton7>,
                        Entry<simconnect::KeyboardButton::Key8, _fbwButton8>,
                        Entry<simconnect::KeyboardButton::Key9, _fbwButton9>,
                        Entry<simconnect::KeyboardButton::KeyNumpad0, _fbwButton0>,
                        Entry<simconnect::KeyboardButton::KeyNumpad1, _fbwButton1>,
                        Entry<simconnect::KeyboardButton::KeyNumpad2, _fbwButton2>,
                        Entry<simconnect::KeyboardButton::KeyNumpad3, _fbwButton3>,
                        Entry<simconnect::KeyboardButton::KeyNumpad4, _fbwButton4>,
                        Entry<simconnect::KeyboardButton::KeyNumpad5, _fbwButton5>,
                        Entry<simconnect::KeyboardButton::KeyNumpad6, _fbwButton6>,
                        Entry<simconnect::KeyboardButton::KeyNumpad7, _fbwButton7>,
                        Entry<simconnect::KeyboardButton::KeyNumpad8, _fbwButton8>,
                        Entry<simconnect::KeyboardButton::KeyNumpad9, _fbwButton9>,
                        Entry<simconnect::KeyboardButton::KeySlash, _fbwButtonSlash>,
                        Entry<simconnect::KeyboardButton::KeyDivide, _fbwButtonSlash>,
                        Entry<simconnect::KeyboardButton::KeyPlus, _fbwButtonPlusMinus>,
                        Entry<simconnect::KeyboardButton::KeyMinus, _fbwButtonPlusMinus>,
                        Entry<simconnect::KeyboardButton::KeySeparator, _fbwButtonDot>,
                        Entry<simconnect::KeyboardButton::KeyDecimal, _fbwButtonDot>,
                        Entry<simconnect::KeyboardButton::KeySpace, _fbwButtonSpace>,
                        Entry<simconnect::KeyboardButton::KeyReturn, _fbwButtonReturn>,
                        Entry<simconnect::KeyboardButton::KeyBackspace, _fbwButtonBackspace>>;

}  // namespace userinputs
