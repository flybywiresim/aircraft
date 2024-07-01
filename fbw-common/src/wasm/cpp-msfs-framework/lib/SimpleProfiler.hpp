// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_SIMPLEPROFILER_HPP
#define FLYBYWIRE_AIRCRAFT_SIMPLEPROFILER_HPP

#include <chrono>
#include <iomanip>
#include <iostream>
#include <locale>
#include <numeric>
#include <sstream>

#include "ProfileBuffer.hpp"
#include "string_utils.hpp"

/**
 * @brief Simple profiler to measure the execution time of a section of code by collecting a certain
 * number of samples and averaging them to provide the average execution time.
 *
 * @usage
 * Use in the following way:<br/>
 *   - Create a SimpleProfiler instance with a name and the number of samples to collect. (e.g. SimpleProfiler profiler{"foo", 1000};)<br/>
 *   - Start the profiler. (e.g. profiler.start();)<br/>
 *   - Execute the code to be profiled. (e.g. doSomething(); doSomethingElse();)<br/>
 *   - Stop the profiler. (e.g. profiler.stop();)<br/>
 *   - Print the average execution time. (e.g. profiler.print();)<br/>
 *     - the average will always be re-calculated from the available samples everytime this method is called.<br/>
 *     - Output will be printed to std::cout: "Profiler:     33,052 (32,898) nanoseconds for MsfsHandler::update() (avg of 120
 * samples)"<br/>
 *     - The first number is the average execution time of the collected samples at the time of calling this method.<br/>
 *     - The second number is the avg of the 5-95% samples at the time of calling this method.<br/>
 */
class SimpleProfiler {
  using Clock = std::chrono::high_resolution_clock;

 private:
  const std::string _name;
  Clock::time_point _start{};
  bool              _started = false;

  ProfileBuffer<std::chrono::nanoseconds> _samples;

 public:
  SimpleProfiler() = delete;

  /**
   * @brief Construct a new Simple Profiler object
   * @param name Name of the profiler for the output
   * @param sampleCount Maximum number of samples to collect
   */
  SimpleProfiler(const std::string& name, size_t sampleCount) : _name{name}, _samples{sampleCount} {}

  /**
   * @brief Start the profiler - will reset the start time if it was already started
   */
  void start() {
    _started = true;
    _start   = Clock::now();
  }

  /**
   * @brief Stop the profiler and add the sample to the buffer
   */
  void stop() {
    if (!_started)
      return;
    _samples.push((Clock::now() - _start));
    _started = false;
  }

  /**
   * @brief Return the average execution time of the collected samples at the time of calling this method
   * @return Average execution time of the collected samples at the time of calling this method
   */
  [[nodiscard]] std::uint64_t getAverage() { return _samples.avg().count(); }

  /**
   * @brief Return the average execution time of the collected samples at the time of calling this method
   * @return Average execution time of the collected samples at the time of calling this method
   */
  [[nodiscard]] std::uint64_t getTrimmedAverage(double trim) { return _samples.trimmedAverage(trim).count(); }

  /**
   * @brief Return the avg minimum execution time of a percentile of the collected samples at the time of calling this method.
   * If no percentile is given, the minimum of all samples is returned.
   * @param percentile Percentile to return, e.g. 0.05 for the 5% minimum. If no percentile is given, the minimum of all samples is
   * returned.
   * @return Average execution time of the minimum percentile of the collected samples at the time of calling this method or the minimum of
   * all samples if no percentile is given
   */
  std::uint64_t getMinimum(float percentile = 0.0f) { return _samples.minimum(percentile).count(); }

  /**
   * @brief Return the avg maximum execution time of a percentile of the collected samples at the time of calling this method.
   * @param percentile Percentile to return, e.g. 0.95 for the 95% maximum. If no percentile is given, the maximum of all samples is
   * returned.
   * @return Average execution time of the maximum percentile of the collected samples at the time of calling this method or the maximum of
   * all samples if no percentile is given
   */
  std::uint64_t getMaximum(float percentile = 1.0f) { return _samples.maximum(percentile).count(); }

  /**
   * @brief Return the sum of all collected samples at the time of calling this method
   * @return Sum of all collected samples at the time of calling this method
   */
  [[nodiscard]] std::uint64_t getSum() { return _samples.sum().count(); }

  /**
   * @brief Return the number of collected samples at the time of calling this method
   * @return Number of collected samples at the time of calling this method
   */
  [[nodiscard]] std::size_t getSampleCount() { return _samples.size(); }

  /**
   * @brief Return a string with the average execution time of the collected samples at the time of calling this method
   * @format Profiler:     207 (     100 /           202 /           400) nanoseconds for Perft::update (avg of 100 samples) <br/>
   *         Profiler: average ( minimum / trimmed average 5% / maximum ) <name>
   * @return String with the average execution time of the collected samples at the time of calling this method
   */
  [[nodiscard]] std::string str() {
    auto              avg = _samples.avg();
    std::stringstream os{};
    os << "Profiler: " << std::setw(10) << std::right << helper::StringUtils::insertThousandsSeparator(avg.count()) << " (" << std::setw(10)
       << std::right << helper::StringUtils::insertThousandsSeparator(_samples.minimum().count()) << " / " << std::setw(10) << std::right
       << helper::StringUtils::insertThousandsSeparator(_samples.trimmedAverage().count()) << " / " << std::setw(10) << std::right
       << helper::StringUtils::insertThousandsSeparator(_samples.maximum().count()) << ")"
       << " nanoseconds for " << _name << " (avg of " << _samples.size() << " samples) " << std::endl;
    return os.str();
  }

  /**
   * @brief Print the average execution time of the collected samples at the time of calling this method to std::cout
   */
  void print() { std::cout << str() << std::endl; }
};

#endif  // FLYBYWIRE_AIRCRAFT_SIMPLEPROFILER_HPP
