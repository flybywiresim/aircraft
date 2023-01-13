#pragma once

#include "callback.hpp"

namespace base {

/**
 * @brief Base class to define classes which support callback's that are triggered as soon as the overwatched data is changed
 *
 */
class Changeable {
 private:
  Callback<void(void)> _onChangeCallback;

 protected:
  Changeable() : _onChangeCallback() {}
  Changeable(const Changeable&) = delete;
  virtual ~Changeable() {}

  Changeable& operator=(const Changeable&) = delete;

  void changed() {
    if (this->_onChangeCallback.function != nullptr) {
      this->_onChangeCallback.function();
    }
  }

 public:
  /**
   * @brief Set the OnChange callback function as a member function
   *
   * @tparam T The type of the class which defines the callback function
   * @param callback Pointer to the callback function
   * @param instance The instance of the callback function
   */
  template <typename T>
  void setOnChangeCallback(void (*callback)(void), T* instance) {
    this->_onChangeCallback.function = std::bind(callback, instance);
  }

  /**
   * @brief Set the OnChange callback object for non-member functions (i.e. lambda-functions)
   * @param function The function object of the callback function
   */
  void setOnChangeCallback(std::function<void(void)> function) { this->_onChangeCallback.function = function; }
};

}  // namespace base
