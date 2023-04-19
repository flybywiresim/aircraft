#pragma once

#include <base/callback.hpp>

namespace base {

/**
 * @brief Base class to define classes which support callback's that are triggered as soon as the overwatched data is changed
 *
 * @tparam T Parameter definition that is received or contains the received data
 */
template <typename T>
class Receivable {
 private:
  Callback<void(T&)> _onReceiveCallback;

 protected:
  Receivable() : _onReceiveCallback() {}
  Receivable(const Changeable&) = delete;
  virtual ~Receivable() {}

  Receivable& operator=(const Receivable&) = delete;

  void received(T& data) {
    if (this->_onReceiveCallback.function != nullptr) {
      this->_onReceiveCallback.function(data);
    }
  }

 public:
  /**
   * @brief Set the OnReceive callback function as a member function
   *
   * @tparam T The type of the class which defines the callback function
   * @param callback Pointer to the callback function
   * @param instance The instance of the callback function
   */
  template <typename Q>
  void setOnReceiveCallback(void (*callback)(T&), Q* instance) {
    this->_onReceiveCallback.function = std::bind(callback, instance);
  }

  /**
   * @brief Set the OnReceive callback object for non-member functions (i.e. lambda-functions)
   * @param function The function object of the callback function
   */
  void setOnReceiveCallback(std::function<void(T&)> function) { this->_onReceiveCallback.function = function; }
};

}  // namespace base
