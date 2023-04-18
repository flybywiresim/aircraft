// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_PROFILEBUFFER_HPP
#define FLYBYWIRE_AIRCRAFT_PROFILEBUFFER_HPP

#include <deque>
#include <iostream>

/**
 * @brief A buffer to collect a fixed number of values for profiling purposes.
 * @details The buffer will collect the last n values and provide methods to
 * calculate the sum, average and trimmed average of the collected values.
 * @tparam T the type of the values to collect
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
  explicit ProfileBuffer(size_t capacity) : _capacity(capacity) {}

  /**
   * @brief Push a new value into the buffer.
   * @details If the buffer is full, the oldest value will be overwritten.
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
    T sum{};
    for (const auto& value : _buffer) {
      sum += value;
    }
    return sum;
  }

  /**
   * @brief Calculate the average of all values in the buffer at the time of the call.
   * @return average of all values
   */
  T avg() { return sum() / _buffer.size(); }

  /**
   * @brief Calculate the trimmed average of all values in the buffer at the time of the call.
   * @param trimPercent the percentage of values to trim from the buffer before calculating the average (default: 5%)
   * @return trimmed average of all values
   */
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
  size_t size() const { return _buffer.size(); }

  /**
   * @brief Get the capacity of the buffer.
   * @return Capacity of the buffer.
   */
  size_t capacity() const { return _capacity; }

};

#endif  // FLYBYWIRE_AIRCRAFT_PROFILEBUFFER_HPP
