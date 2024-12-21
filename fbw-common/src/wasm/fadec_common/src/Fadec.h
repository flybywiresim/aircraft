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
  static constexpr double LBS_TO_KGS = 0.4535934;
  static constexpr double KGS_TO_LBS = 1 / 0.4535934;

  // delete the default constructor for this virtual class
  Fadec() = delete;

  /**
   * Creates a new Fadec instance and takes a reference to the MsfsHandler instance.
   * @param msfsHandler The MsfsHandler instance that is used to communicate with the simulator.
   */
  explicit Fadec(MsfsHandler& msfsHandler) : Module(msfsHandler) {}

  virtual bool initialize() override                      = 0;
  virtual bool preUpdate(sGaugeDrawData* pData) override  = 0;
  virtual bool update(sGaugeDrawData* pData) override     = 0;
  virtual bool postUpdate(sGaugeDrawData* pData) override = 0;
  virtual bool shutdown() override                        = 0;

 public:
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
  static double interpolate(double x, double x0, double x1, double y0, double y1);

  /**
   * @brief Converts calibrated airspeed (CAS) to Mach number.
   *
   * This function converts the calibrated airspeed (CAS) to the Mach number. The conversion is based on the ambient pressure and a constant
   * `k`. The Mach number is calculated using the formula: sqrt((5 * pow(((pow(((pow(cas, 2) / k) + 1), 3.5) * (1 / delta)) - (1 / delta) +
   * 1), 0.285714286)) - 5), where delta is the ratio of the ambient pressure to the standard pressure at sea level.
   *
   * @param cas The calibrated airspeed in knots.
   * @param ambientPressure The ambient pressure in hPa.
   * @return The Mach number.
   */
  static double cas2mach(double cas, double ambientPressure);
};

#endif  // FLYBYWIRE_AIRCRAFT_FADEC_H
