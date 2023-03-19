#include <iostream>
#include <string_view>
#include <tuple>

#include "../../simconnect/keyboardinputevent.hpp"
#include "../../simconnect/lvarobject.hpp"

namespace userinputs {

template <simconnect::KeyboardButton Button,
          std::string_view const& KccuLeft,
          std::string_view const& KccuRight,
          std::string_view const& OitLeft,
          std::string_view const& OitRight>
class AlphabeticalKeyboardButton : public simconnect::KeyboardAlphabeticalEvent<Button, true, true> {
 private:
  std::tuple<std::uint64_t, std::shared_ptr<simconnect::LVarObject<KccuLeft>>> _kccuLeft;
  std::uint64_t _lastInputActivationKccuRight;
  std::uint64_t _lastInputActivationOitLeft;
  std::uint64_t _lastInputActivationOitRight;

  bool onEventTriggered() override {
    std::cout << "KEY PRESSED " << KccuLeft << std::endl;
    std::get<1>(this->_kccuLeft)->template value<KccuLeft>() = 1.0;
    std::get<1>(this->_kccuLeft)->writeValues();
    return true;
  }

 public:
  AlphabeticalKeyboardButton(simconnect::Connection& connection)
      : _kccuLeft(std::make_tuple(0ULL, connection.lvarObject<KccuLeft>())),
        _lastInputActivationKccuRight(0),
        _lastInputActivationOitLeft(0),
        _lastInputActivationOitRight(0) {}
};

}  // namespace userinputs
