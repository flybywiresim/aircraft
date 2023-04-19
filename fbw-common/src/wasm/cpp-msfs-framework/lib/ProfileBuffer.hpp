// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_PROFILEBUFFER_HPP
#define FLYBYWIRE_AIRCRAFT_PROFILEBUFFER_HPP

#include <deque>
#include <iostream>
#include <numeric>
#include <algorithm>
#include <type_traits>

// required to check valid template parameters - numeric types and std::chrono::duration
template<typename T>
struct is_duration : std::false_type {};
template<typename Rep, typename Period>
struct is_duration<std::chrono::duration<Rep, Period>> : std::true_type {};
template<typename T>
struct is_numeric : std::integral_constant<bool, std::is_arithmetic<T>::value> {};
template<typename T>
struct is_numeric<std::chrono::duration<T>> : std::true_type {};

/**
 * @brief A buffer to collect a fixed number of values for profiling purposes.
 * @details The buffer will collect the last n values and provide methods to
 * calculate the sum, average and trimmed average of the collected values.
 * @tparam T the type of the values to collect - must be numeric or a duration
 */
template <typename T>
class ProfileBuffer {
 private:
  std::deque<T> _buffer;
  size_t _capacity;

 public:
  /**
   * @brief Construct a new Profile Buffer object
   * @param capacity the maximum number of values to collect in the buffer
   */
  explicit ProfileBuffer(size_t capacity) : _capacity(capacity) {
    static_assert(is_numeric<T>::value || is_duration<T>::value, "T must be numeric or duration type");
  }

  /**
   * @brief Push a new value into the buffer.
   * @details If the buffer is full, the oldest value will be removed.
   * @param value the value to push
   */
  void push(T value) {
    if (_buffer.size() == _capacity) {
      _buffer.pop_front();
    }
    _buffer.push_back(value);
  }

  /**
   * @brief Calculate the sum of all values in the buffer at the time of the call.
   * @return sum of all values
   */
  T sum() {
    // std::accumulate can't be used here because it doesn't work with std::chrono::duration
    T sum{};
    for (const auto& value : _buffer) {
      sum += value;
    }
    return sum;
  }

  /**
   * @brief Calculate the average of all values in the buffer at the time of the call.
   * @return average of all values with type T
   */
  [[nodiscard]]
  inline T avg() { return sum() / _buffer.size(); }

  /**
   * @brief Calculate the trimmed average of all values in the buffer at the time of the call.
   * @param trimPercent the percentage of values to trim from the buffer before calculating the average (default: 5%)
   * @return trimmed average of all values
   */
  [[nodiscard]]
  T trimmedAverage(float trimPercent = 0.05) {
    std::sort(_buffer.begin(), _buffer.end());
    const int bufferSize = _buffer.size();
    const int trimSize = bufferSize * trimPercent;
    T sum{};
    for (int i = trimSize; i < bufferSize - trimSize; i++) {
      sum += _buffer[i];
    }
    return sum / (bufferSize - trimSize * 2);
  }

  /**
   * @brief Get the current number of values in the buffer.
   * @return Current number of values in the buffer.
   */
  [[nodiscard]]
  size_t size() const { return _buffer.size(); }

  /**
   * @brief Get the capacity of the buffer.
   * @return Capacity of the buffer.
   */
  [[nodiscard]]
  size_t capacity() const { return _capacity; }

};

#endif  // FLYBYWIRE_AIRCRAFT_PROFILEBUFFER_HPP
