// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_PROFILEBUFFER_HPP
#define FLYBYWIRE_AIRCRAFT_PROFILEBUFFER_HPP

#include <algorithm>
#include <chrono>
#include <deque>
#include <iostream>
#include <numeric>
#include <type_traits>

// required to check valid template parameters - numeric types and std::chrono::duration
template <typename T>
struct is_duration : std::false_type {};
template <typename Rep, typename Period>
struct is_duration<std::chrono::duration<Rep, Period>> : std::true_type {};
template <typename T>
struct is_numeric : std::integral_constant<bool, std::is_arithmetic<T>::value> {};
template <typename T>
struct is_numeric<std::chrono::duration<T>> : std::true_type {};

/**
 * @brief A buffer to collect a fixed number of values for profiling purposes.
 * @details The buffer will collect the last n values and provide methods to
 * calculate the sum, average and trimmed average of the collected values.
 * @tparam T the type of the values to collect - must be numeric or a std::chrono::duration
 */
template <typename T>
class ProfileBuffer {
 private:
  std::size_t   _capacity;
  std::deque<T> _buffer;

 public:
  /**
   * @brief Construct a new Profile Buffer object
   * @param capacity the maximum number of values to collect in the buffer
   */
  explicit ProfileBuffer(std::size_t capacity) : _capacity{capacity}, _buffer{std::deque<T>()} {
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
#if __cpp_lib_parallel_algorithm >= 201603
    return std::reduce(_buffer.begin(), _buffer.end(), T(0));
#else
    return std::accumulate(_buffer.begin(), _buffer.end(), T(0));
#endif
  }

  /**
   * @brief Calculate the average of all values in the buffer at the time of the call.
   * @return average of all values with type T
   */
  [[nodiscard]] inline T avg() { return sum() / _buffer.size(); }

  /**
   * @brief Calculate the trimmed average of all values in the buffer at the time of the call.
   * The trimmed average is calculated by creating a sorted copy of the buffer and removing the
   * lowest and highest values before calculating the average.
   * @param trimPercent the percentage of values to trim from the buffer before calculating the average (default: 5%)
   * @return trimmed average of all values
   */
  [[nodiscard]] T trimmedAverage(float trimPercent = 0.05f) {
    auto sorted = _buffer;
    std::sort(sorted.begin(), sorted.end());
    const std::size_t trimSize = sorted.size() * trimPercent;

#if __cpp_lib_parallel_algorithm >= 201603
    return std::reduce(sorted.begin() + trimSize, sorted.end() - trimSize, T(0)) / (sorted.size() - trimSize * 2);
#else
    return std::accumulate(sorted.begin() + trimSize, sorted.end() - trimSize, T(0)) / (sorted.size() - trimSize * 2);
#endif
  }

  /**
   * @brief Get the minimum value in the buffer. If percentile is set, the minimum value will be calculated by
   *        averaging the lowest percentile values in the buffer.
   * @param percentile Percentile to return, e.g. 0.05 for the 5% minimum. If no percentile is given, the minimum of all values is returned.
   * @return Average value of the minimum percentile of the collected samples at the time of calling this method or the minimum of
   * all samples if no percentile is given
   */
  [[nodiscard]] T minimum(float percentile = 0.0f) {
    if (percentile > 0.0) {
      auto sorted = _buffer;
      std::sort(sorted.begin(), sorted.end());
      const std::size_t trimSize = sorted.size() * percentile;
#if __cpp_lib_parallel_algorithm >= 201603
      return std::reduce(sorted.begin(), sorted.begin() + trimSize, T(0)) / trimSize;
#else
      return std::accumulate(sorted.begin(), sorted.begin() + trimSize, T(0)) / trimSize;
#endif
    }
    return *std::min_element(_buffer.begin(), _buffer.end());
  }

  /**
   * @brief Get the maximum value in the buffer. If percentile is set, the maximum value will be calculated by
   *        averaging the highest percentile values in the buffer.
   * @param percentile Percentile to return, e.g. 0.05 for the 5% maximum. If no percentile is given, the maximum of all values is returned.
   * @return Average value of the maximum percentile of the collected samples at the time of calling this method or the maximum of
   * all samples if no percentile is given
   */
  [[nodiscard]] T maximum(float percentile = 0.0f) {
    if (percentile > 0.0) {
      auto sorted = _buffer;
      std::sort(sorted.begin(), sorted.end());
      const std::size_t trimSize = sorted.size() * percentile;
      return std::accumulate(sorted.end() - trimSize, sorted.end(), T(0)) / trimSize;
    }
    return *std::max_element(_buffer.begin(), _buffer.end());
  }

  /**
   * @brief Get the current number of values in the buffer.
   * @return Current number of values in the buffer.
   */
  [[nodiscard]] std::size_t size() const { return _buffer.size(); }

  /**
   * @brief Get the capacity of the buffer.
   * @return Capacity of the buffer.
   */
  [[nodiscard]] std::size_t capacity() const { return _capacity; }
};

#endif  // FLYBYWIRE_AIRCRAFT_PROFILEBUFFER_HPP
