#pragma once

class SimVars;

/// <summary>
/// The handle to the SimConnect instance.
/// </summary>
HANDLE hSimConnect;

/// <summary>
/// The environmental corrected ratios
/// </summary>
class Ratios {
 public:
  FLOAT64 theta(double altitude) {
    double t = (288.15 - (1.98 * altitude / 1000)) / 288.15;
    return t;
  }

  FLOAT64 delta(double altitude) {
    double d = pow(this->theta(altitude), 5.256);
    return d;
  }

  FLOAT64 theta2(double mach, double altitude) {
    double t2 = this->theta(altitude) * (1 + 0.2 * pow(mach, 2));
    return t2;
  }

  FLOAT64 delta2(double mach, double altitude) {
    double d2 = this->delta(altitude) * pow((1 + 0.2 * pow(mach, 2)), 3.5);
    return d2;
  }
};

// Timer Class for Performance Profiling purposes
class Timer {
 public:
  Timer() { m_StartTimepoint = std::chrono::high_resolution_clock::now(); }

  ~Timer() { Stop(); }
  void Stop() {
    auto endTimepoint = std::chrono::high_resolution_clock::now();

    auto start = std::chrono::time_point_cast<std::chrono::microseconds>(m_StartTimepoint).time_since_epoch().count();
    auto end = std::chrono::time_point_cast<std::chrono::microseconds>(endTimepoint).time_since_epoch().count();

    auto duration = end - start;
    double ms = duration * 0.001;
    // std::cout << "WASM: " << duration << "us (" << ms << "ms)\n" << std::flush;
  }

 private:
  std::chrono::time_point<std::chrono::high_resolution_clock> m_StartTimepoint;
};

template <typename T /*, typename = std::enable_if_t<std::is_integral_v<T>>*/>
std::string to_string_with_zero_padding(const T& value, std::size_t total_length) {
  auto str = std::to_string(value);
  if (str.length() < total_length)
    str.insert(str.front() == '-' ? 1 : 0, total_length - str.length(), '0');
  return str;
}

double imbalance_extractor(double imbalance, int parameter) {
  double reg = 0;

  parameter = 4 - parameter;

  while (parameter > 0) {
    reg = int(imbalance) % 100;
    imbalance /= 100;
    parameter--;
  }

  return reg;
}
