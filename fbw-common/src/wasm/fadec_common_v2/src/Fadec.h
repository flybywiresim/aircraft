// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_FADEC_H
#define FLYBYWIRE_AIRCRAFT_FADEC_H

#include <cmath>

#include "DataManager.h"
#include "Module.h"

class MsfsHandler;

class Fadec : public Module {
 public:
  Fadec() = delete;

  /**
   * Creates a new Pushback instance and takes a reference to the MsfsHandler instance.
   * @param msfsHandler The MsfsHandler instance that is used to communicate with the simulator.
   */
  explicit Fadec(MsfsHandler& msfsHandler) : Module(msfsHandler) {}

  virtual bool initialize() override = 0;
  virtual bool preUpdate(sGaugeDrawData* pData) override = 0;
  virtual bool update(sGaugeDrawData* pData) override = 0;
  virtual bool postUpdate(sGaugeDrawData* pData) override = 0;
  virtual bool shutdown() override = 0;

 public:

  // TODO: should these functions below be in here?

  /**
   * @brief Interpolates a value using linear interpolation.
   *
   * This function performs linear interpolation based on the input parameters. It calculates the value of 'y' at a given 'x'
   * using the formula for linear interpolation: y = ((y0 * (x1 - x)) + (y1 * (x - x0))) / (x1 - x0).
   * If x0 is equal to x1, it returns y0 to avoid division by zero.
   *
   * This function is used by MSFS for the engine tables.
   *
   * @param x The 'x' value at which to interpolate.
   * @param x0 The 'x' value of the first data point.
   * @param x1 The 'x' value of the second data point.
   * @param y0 The 'y' value of the first data point.
   * @param y1 The 'y' value of the second data point.
   * @return The interpolated 'y' value at 'x'.
   */
  static double interpolate(double x, double x0, double x1, double y0, double y1) {
    if (x0 == x1) return y0;
    if (x < x0) return y0;
    if (x > x1) return y1;
    return ((y0 * (x1 - x)) + (y1 * (x - x0))) / (x1 - x0);
  }

  /**
 * @brief Calculates the ratio of the ambient temperature to the standard temperature at sea level.
 *
 * This function calculates the ratio of the ambient temperature (in degrees Celsius) to the standard
 * temperature at sea level (15 degrees Celsius).
 * The result is dimensionless and is used in various aerodynamic and engine performance calculations.
 *
 * @param ambientTemp The ambient temperature in degrees Celsius.
 * @return The ratio of the ambient temperature to the standard temperature at sea level.
 */
static FLOAT64 theta(double ambientTemp) {
  return (273.15 + ambientTemp) / 288.15;
}

/**
 * @brief Calculates the ratio of the ambient pressure to the standard pressure at sea level.
 *
 * This function calculates the ratio of the ambient pressure (in hPa) to the standard pressure at
 * sea level (1013 hPa).
 * The result is dimensionless and is used in various aerodynamic and engine performance calculations.
 *
 * @param ambientPressure The ambient pressure in hPa.
 * @return The ratio of the ambient pressure to the standard pressure at sea level.
 */
static FLOAT64 delta(double ambientPressure) {
  return ambientPressure / 1013;
}

/**
 * @brief Calculates the ratio of the total temperature to the standard temperature at sea level,
 *        accounting for the effects of Mach number.
 *
 * This function calculates the ratio of the total temperature (in degrees Celsius) to the standard
 * temperature at sea level (15 degrees Celsius),
 * accounting for the effects of Mach number. The result is dimensionless and is used in various
 * aerodynamic and engine performance calculations.
 *
 * @param mach The Mach number.
 * @param ambientTemp The ambient temperature in degrees Celsius.
 * @return The ratio of the total temperature to the standard temperature at sea level, accounting
 * for the effects of Mach number.
 */
static FLOAT64 theta2(double mach, double ambientTemp) {
  return theta(ambientTemp) * (1 + 0.2 * pow(mach, 2));
}

/**
 * @brief Calculates the ratio of the total pressure to the standard pressure at sea level,
 * accounting for the effects of Mach number.
 *
 * This function calculates the ratio of the total pressure (in hPa) to the standard pressure at
 * sea level (1013 hPa), accounting for the effects of Mach number. The result is dimensionless and
 * is used in various aerodynamic and engine performance calculations.
 *
 * @param mach The Mach number.
 * @param ambientPressure The ambient pressure in hPa.
 * @return The ratio of the total pressure to the standard pressure at sea level, accounting for the effects of Mach number.
 */
static FLOAT64 delta2(double mach, double ambientPressure) {
  return delta(ambientPressure) * pow((1 + 0.2 * pow(mach, 2)), 3.5);
}

/**
 * @brief Decodes the imbalance of an engine parameter.
 *
 * This function decodes the imbalance of a specific engine parameter from a coded word. The coded
 * word is a double value where each pair of digits represents the imbalance of a specific engine
 * parameter. The function extracts the imbalance for the specified parameter by repeatedly dividing
 * the coded word by 100 and taking the remainder until the desired parameter is reached.
 *
 * @param imbalanceCode The coded word representing the imbalances of all engine parameters. Each
 *                      pair of digits represents the imbalance of a specific parameter.
 * @param parameter The index of the engine parameter to extract the imbalance for. The parameters
*                   are indexed in reverse order, with the last parameter being 1 and the first being 9.
 * @return The imbalance of the specified engine parameter.
 */
static int imbalanceExtractor(double imbalanceCode, int parameter) {
  parameter = 9 - parameter;
  while (parameter > 0) {
    imbalanceCode = fmod(imbalanceCode, 100);
    imbalanceCode /= 100;
    parameter--;
  }
  return static_cast<int>(imbalanceCode);
}

/**
 * @brief Converts calibrated airspeed (CAS) to Mach number.
 *
 * This function converts the calibrated airspeed (CAS) to the Mach number. The conversion is based on the ambient pressure and a constant `k`.
 * The Mach number is calculated using the formula: sqrt((5 * pow(((pow(((pow(cas, 2) / k) + 1), 3.5) * (1 / delta)) - (1 / delta) + 1), 0.285714286)) - 5), where delta is the ratio of the ambient pressure to the standard pressure at sea level.
 *
 * @param cas The calibrated airspeed in knots.
 * @param ambientPressure The ambient pressure in hPa.
 * @return The Mach number.
 */
static double cas2mach(double cas, double ambientPressure) {
  double k = 2188648.141;
  double delta = ambientPressure / 1013;
  return sqrt((5 * pow(((pow(((pow(cas, 2) / k) + 1), 3.5) * (1 / delta)) - (1 / delta) + 1), 0.285714286)) - 5);
}

};

#endif  // FLYBYWIRE_AIRCRAFT_FADEC_H
