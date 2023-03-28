#pragma once

#include <array>
#include <string_view>
#include <tuple>

#include "../../helper/stringconcat.hpp"
#include "../../simconnect/keyboardinputevent.hpp"
#include "../../simconnect/lvarobject.hpp"
#include "keyboardmap.hpp"

namespace userinputs {

// parameters to define the LVars for the different subsystems
static constexpr std::string_view KccuPrefix = "KCCU_";
static constexpr std::string_view KccuLeftSide = "L_";
static constexpr std::string_view KccuRightSide = "R_";
static constexpr std::string_view OitKeyboardPrefix = "KBD_";
static constexpr std::string_view OitKeyboardLeftSide = "CPT_";
static constexpr std::string_view OitKeyboardRightSide = "FO_";

template <simconnect::KeyboardButton Button>
class StandardKeyboardButton : public simconnect::KeyboardInputEvent<simconnect::KeyboardStandardEvent<Button>> {
 private:
  // create the LVar names for the KCCUs
  static constexpr auto KccuButtonName = KeyboardMap::get<Button>::value;
  static constexpr auto KccuLeft = helper::concat<KccuPrefix, KccuLeftSide, KccuButtonName>;
  static constexpr auto KccuRight = helper::concat<KccuPrefix, KccuRightSide, KccuButtonName>;

  // create the LVar names for the OIT keyboards
  static constexpr auto OitButtonName = KeyboardMap::get<Button>::value;
  static constexpr auto OitLeft = helper::concat<OitKeyboardPrefix, OitKeyboardLeftSide, OitButtonName>;
  static constexpr auto OitRight = helper::concat<OitKeyboardPrefix, OitKeyboardRightSide, OitButtonName>;

  std::tuple<std::uint64_t, std::shared_ptr<simconnect::LVarObject<KccuLeft>>> _kccuLeft;
  std::tuple<std::uint64_t, std::shared_ptr<simconnect::LVarObject<KccuRight>>> _kccuRight;
  std::tuple<std::uint64_t, std::shared_ptr<simconnect::LVarObject<OitLeft>>> _oitLeft;
  std::tuple<std::uint64_t, std::shared_ptr<simconnect::LVarObject<OitRight>>> _oitRight;

 public:
  StandardKeyboardButton(simconnect::Connection& connection)
      : simconnect::KeyboardInputEvent<simconnect::KeyboardStandardEvent<Button>>(),
        _kccuLeft(std::make_tuple(0ULL, connection.lvarObject<KccuLeft>())),
        _kccuRight(std::make_tuple(0ULL, connection.lvarObject<KccuRight>())),
        _oitLeft(std::make_tuple(0ULL, connection.lvarObject<OitLeft>())),
        _oitRight(std::make_tuple(0ULL, connection.lvarObject<OitRight>())) {}

  bool onEventTriggered() override {
    std::get<1>(this->_kccuLeft)->template value<KccuLeft>() = 1.0;
    std::get<1>(this->_kccuLeft)->writeValues();
    return true;
  }
};

}  // namespace userinputs
