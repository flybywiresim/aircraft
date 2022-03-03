#pragma once

class SimVars;

HANDLE hSimConnect;

/// <summary>
/// Custom POW function
/// </summary>
double powFBW(double base, size_t exponent) {
  double power = 1.0;

  while (exponent > 0) {
    power *= base;
    --exponent;
  }

  return power;
}

/// <summary>
/// Custom EXP function
/// </summary>
double expFBW(double x) {
  int n = 8;
  x = 1.0 + x / 256.0;

  while (n > 0) {
    x *= x;
    --n;
  }
  return x;
}

/// <summary>
/// Timer Class for Performance Profiling purposes. TO BE DELETED!
/// </summary>
class Timer {
 public:
  Timer() : m_StartTimepoint{clock_type::now()} {}
  ~Timer() {}

  void reset() { m_StartTimepoint = clock_type::now(); }

  double elapsed() {
    auto start = std::chrono::time_point_cast<std::chrono::microseconds>(m_StartTimepoint).time_since_epoch().count();
    auto end = std::chrono::time_point_cast<std::chrono::microseconds>(clock_type::now()).time_since_epoch().count();

    auto duration = end - start;
    double ms = duration * 0.001;
    return ms;  // ms
  }

 private:
  using clock_type = std::chrono::steady_clock;

  std::chrono::time_point<clock_type> m_StartTimepoint;
};
