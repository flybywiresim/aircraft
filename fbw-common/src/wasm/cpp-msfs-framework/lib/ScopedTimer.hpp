// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_SCOPEDTIMER_HPP
#define FLYBYWIRE_AIRCRAFT_SCOPEDTIMER_HPP

#include <chrono>
#include <iomanip>
#include <iostream>
#include <string_view>

/**
 * @brief Macro to create a scoped timer. Will only create the timer if profiling is enabled.
 */
#if PROFILING
#define SCOPED_TIMER(name) ScopedTimer timer{name};
#else
#define SCOPED_TIMER(name) void(0);
#endif

/**
 * Simple scoped timer to measure the execution time of a function.
 * Use in the following way:
 *
 * void foo() {
 *   ScopedTimer timer{"foo"};
 *   // do something
 * }
 *
 * Output will be printed to std::cout as soon as the timer goes out of scope.
 */
class ScopedTimer {
  using ClockType = std::chrono::high_resolution_clock;

 private:
  const std::string_view      _timerName{};
  const ClockType::time_point _start{};

 public:
  /**
   * @brief Construct a new Scoped Timer object. Will immediately start the timer and will print the
   * execution time when the object goes out of scope.
   * @param timerName Name of the timer for the output
   */
  ScopedTimer(const std::string_view& timerName) : _timerName{timerName}, _start{ClockType::now()} {}

  /**
   * @brief Destroy the Scoped Timer object. Will print the execution time to std::cout.
   */
  ~ScopedTimer() {
    using namespace std::chrono;
    const auto stop           = ClockType::now();
    const auto duration       = (stop - _start);
    const auto duration_micro = duration_cast<microseconds>(duration).count();
    std::cout << "Timer: " << std::setw(10) << std::right << duration_micro << " microseconds"
              << " for " << _timerName << std::endl;
  }

  ScopedTimer(const ScopedTimer&)                     = delete;
  ScopedTimer(ScopedTimer&&)                          = delete;
  auto operator=(const ScopedTimer&) -> ScopedTimer&  = delete;
  auto operator=(const ScopedTimer&&) -> ScopedTimer& = delete;
};

#endif  // FLYBYWIRE_AIRCRAFT_SCOPEDTIMER_HPP
