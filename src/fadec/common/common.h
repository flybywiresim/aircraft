#pragma once

class SimVars;

HANDLE hSimConnect;

/// <summary>
/// Interpolation function being used by MSFS for the engine tables
/// </summary>
/// <returns>Interpolated 'y' for a given 'x'.</returns>
double interpolate(double x, double x0, double x1, double y0, double y1) {
  double y = 0;

  if (x0 == x1) {
    y = y0;
  } else {
    y = ((y0 * (x1 - x)) + (y1 * (x - x0))) / (x1 - x0);
  }

  return y;
}

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
/// Environmental corrected ratios
/// </summary>
class EngineRatios {
 public:
  FLOAT64 theta(double ambientTemp) {
    double t = (273.15 + ambientTemp) / 288.15;
    return t;
  }

  FLOAT64 delta(double ambientPressure) {
    double d = ambientPressure / 1013;
    return d;
  }

  FLOAT64 theta2(double mach, double ambientTemp) {
    double t2 = this->theta(ambientTemp) * (1 + 0.2 * powFBW(mach, 2));
    return t2;
  }

  FLOAT64 delta2(double mach, double ambientPressure) {
    double d2 = this->delta(ambientPressure) * pow((1 + 0.2 * powFBW(mach, 2)), 3.5);
    return d2;
  }
};

/// <summary>
/// Padding for the imbalance function
/// </summary>
template <typename T /*, typename = std::enable_if_t<std::is_integral_v<T>>*/>
std::string to_string_with_zero_padding(const T& value, std::size_t total_length) {
  auto str = std::to_string(value);
  if (str.length() < total_length)
    str.insert(str.front() == '-' ? 1 : 0, total_length - str.length(), '0');
  return str;
}

/// <summary>
/// Imbalance decoder function
/// </summary>
/// <param name="imbalanceCode">The imbalance coded word (2-bytes per parameter).</param>
/// <param name="parameter">The engine parameter which is being imbalanced.</param>
double imbalanceExtractor(double imbalanceCode, int parameter) {
  double reg = 0;

  parameter = 9 - parameter;

  while (parameter > 0) {
    reg = fmod(imbalanceCode, 100);
    imbalanceCode /= 100;
    parameter--;
  }

  return int(reg);
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
