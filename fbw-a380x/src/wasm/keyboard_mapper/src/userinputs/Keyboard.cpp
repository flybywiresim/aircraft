#include "Keyboard.h"
#include "buttons/KeyboardButtons.hpp"

using namespace userinputs;

static std::shared_ptr<simconnect::InputEventGroup<SIMCONNECT_GROUP_PRIORITY_HIGHEST>> testevent;

Keyboard::Keyboard(simconnect::Connection& connection) {
  testevent = connection.inputEventGroup<SIMCONNECT_GROUP_PRIORITY_HIGHEST>();
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyA>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyB>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyC>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyD>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyE>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyF>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyG>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyH>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyI>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyJ>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyK>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyL>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyM>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyN>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyO>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyP>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyQ>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyR>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyS>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyT>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyU>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyV>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyW>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyX>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyY>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyZ>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::Key0>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::Key1>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::Key2>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::Key3>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::Key4>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::Key5>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::Key6>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::Key7>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::Key8>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::Key9>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyNumpad0>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyNumpad1>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyNumpad2>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyNumpad3>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyNumpad4>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyNumpad5>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyNumpad6>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyNumpad7>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyNumpad8>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyNumpad9>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeySlash>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyDivide>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyPlus>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyMinus>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeySeparator>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyDecimal>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeySpace>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyReturn>(connection)));
  testevent->addEvent(
      std::shared_ptr<simconnect::InputEventBase>(new StandardKeyboardButton<simconnect::KeyboardButton::KeyBackspace>(connection)));
  testevent->activate();
}
