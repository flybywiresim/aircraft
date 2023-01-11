#pragma once

#include "callback.hpp"

namespace base {

class Changeable {
 private:
  Callback<void(void)> _onChangeCallback;

 protected:
  Changeable() : _onChangeCallback() {}

  void changed() {
    if (this->_onChangeCallback.function != nullptr) {
      this->_onChangeCallback.function();
    }
  }

 public:
  template <typename T>
  void setOnChangeCallback(void (*callback)(void), T* instance) {
    this->_onChangeCallback.function = std::bind(callback, instance);
  }

  void setOnChangeCallback(std::function<void(void)> function) { this->_onChangeCallback.function = function; }
};

}  // namespace base
