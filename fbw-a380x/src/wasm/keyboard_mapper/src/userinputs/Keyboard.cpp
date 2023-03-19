#include "Keyboard.h"
#include "buttons/KeyboardButtons.hpp"

using namespace userinputs;

static constexpr std::string_view kccuLeft = "TEST_BTN_A";
static constexpr std::string_view empty = "";
static std::shared_ptr<simconnect::InputEventGroup<1, SIMCONNECT_GROUP_PRIORITY_HIGHEST>> testevent;

Keyboard::Keyboard(simconnect::Connection& connection) {
  testevent = connection.inputEventGroup<1, SIMCONNECT_GROUP_PRIORITY_HIGHEST>();
  testevent->addEvent(std::shared_ptr<simconnect::InputEventBase>(
      new AlphabeticalKeyboardButton<simconnect::KeyboardButton::KeyA, kccuLeft, empty, empty, empty>(connection)));
}
