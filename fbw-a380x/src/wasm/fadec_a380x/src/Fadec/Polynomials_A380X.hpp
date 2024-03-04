#ifndef FLYBYWIRE_AIRCRAFT_POLYNOMIAL_H
#define FLYBYWIRE_AIRCRAFT_POLYNOMIAL_H

#include <cmath>

/**
 * @class Polynomial
 * @brief A collection of multi-variate regression polynomials for engine parameters.
 *
 * This class provides a set of static methods that represent multi-variate regression polynomials.
 * These methods are used to calculate various engine parameters such as N1, N3, EGT, Fuel Flow,
 * Oil Temperature, Oil Gulping, and Oil Pressure.
 * Each method takes specific inputs related to the engine state and returns the calculated parameter value.
 */
class Polynomial {
 public:
  /**
   * @brief Calculates the N3 value during engine shutdown.
   *
   * This function calculates the N3 value, which represents the rotational speed of the engine's
   * low-pressure compressor spool, during the engine shutdown process. The calculation is based on
   * the previous N3 value and the elapsed time since the last update.
   *
   * @param previousN3 The previous N3 value in percent.
   * @param deltaTime The elapsed time since the last update in seconds.
   * @return The calculated N3 value in percent.
   */
  static double shutdownN3(double previousN3, double deltaTime) {
    double decayRate = previousN3 < 30 ? -0.0515 : -0.08183;
    return previousN3 * exp(decayRate * deltaTime);
  }

  /**
   * @brief Calculates the N1 value during engine shutdown.
   *
   * This function calculates the N1 value, which represents the rotational speed of the engine's
   * high-pressure compressor spool, during the engine shutdown process. The calculation is based
   * on the previous N1 value and the elapsed time since the last update.
   *
   * @param previousN1 The previous N1 value in percent.
   * @param deltaTime The elapsed time since the last update in seconds.
   * @return The calculated N1 value in percent.
   */
  static double shutdownN1(double previousN1, double deltaTime) {
    double decayRate = previousN1 < 4 ? -0.08 : -0.164;
    return previousN1 * exp(decayRate * deltaTime);
  }

  /**
   * @brief Calculates the Exhaust Gas Temperature (EGT) during engine shutdown.
   *
   * This function calculates the EGT, which represents the temperature of the exhaust gas during the engine shutdown process.
   * The calculation is based on the previous EGT value, the ambient temperature, and the elapsed time since the last update.
   *
   * @param previousEGT The previous EGT value in degrees Celsius.
   * @param ambientTemp The ambient temperature in degrees Celsius.
   * @param deltaTime The elapsed time since the last update in seconds.
   * @return The calculated EGT value in degrees Celsius.
   */
  static double shutdownEGT(double previousEGT, double ambientTemp, double deltaTime) {
    double threshold = ambientTemp + 140;
    double decayRate;
    double steadyTemp;
    // Adjust the decay rate and the steady temperature based on the previous EGT value
    if (previousEGT > threshold) {
      decayRate = 0.0257743;
      steadyTemp = 135 + ambientTemp;
    } else {
      decayRate = 0.00072756;
      steadyTemp = 30 + ambientTemp;
    }
    // Calculate and return the EGT value during engine shutdown using an exponential decay model
    return steadyTemp + (previousEGT - steadyTemp) * exp(-decayRate * deltaTime);
  }

  /**
   * @brief Calculates the N3 value during engine startup.
   *
   * This function calculates the N3 value, which represents the rotational speed of the engine's
   * low-pressure compressor spool, during the engine startup process. The calculation is based on
   * the current N3 value, the previous N3 value, and the idle N3 value.
   *
   * @param currentN3 The current N3 value in percent.
   * @param previousN3 The previous N3 value in percent.
   * @param idleN3 The idle N3 value in percent.
   * @return The calculated N3 value in percent.
   */
  static double startN3(double currentN3, double previousN3, double idleN3) {
    // Normalize the current N3 value
    double normalizedN3 = currentN3 * 60.0 / idleN3;

    // Coefficients for the polynomial calculation
    double coefficients[16] = {4.03649879e+00,  -9.41981960e-01, 1.98426614e-01,  -2.11907840e-02, 1.00777507e-03,  -1.57319166e-06,
                               -2.15034888e-06, 1.08288379e-07,  -2.48504632e-09, 2.52307089e-11,  -2.06869243e-14, 8.99045761e-16,
                               -9.94853959e-17, 1.85366499e-18,  -1.44869928e-20, 4.31033031e-23};

    // Calculate the N3 value during engine startup using a polynomial model
    double outN3 = 0;
    for (int i = 0; i < 16; i++) {
      outN3 += coefficients[i] * pow(normalizedN3, i);
    }
    outN3 *= currentN3;

    // Ensure the calculated N3 value is within the expected range
    if (outN3 < previousN3) {
      outN3 = previousN3 + 0.002;
    }
    if (outN3 >= idleN3 + 0.1) {
      outN3 = idleN3 + 0.05;
    }

    // Return the calculated N3 value
    return outN3;
  }

  /**
   * @brief Calculates the N1 value during engine startup.
   *
   * This function calculates the N1 value, which represents the rotational speed of the engine's
   * high-pressure compressor spool, during the engine startup process. The calculation is based on
   * the current N3 value, the idle N3 value, and the idle N1 value.
   *
   * @param fbwN3 The current N3 value in percent.
   * @param idleN3 The idle N3 value in percent.
   * @param idleN1 The idle N1 value in percent.
   * @return The calculated N1 value in percent.
   */
  static double startN1(double fbwN3, double idleN3, double idleN1) {
    // Normalize the current N3 value
    double normalizedN3 = fbwN3 / idleN3;

    // Coefficients for the polynomial calculation
    double coefficients[9] = {-2.2812156e-12, -5.9830374e+01, 7.0629094e+02,  -3.4580361e+03, 9.1428923e+03,
                              -1.4097740e+04, 1.2704110e+04,  -6.2099935e+03, 1.2733071e+03};

    // Calculate the N1 value during engine startup using a polynomial model
    double normalN1pre = (-2.4698087 * pow(normalizedN3, 3)) + (0.9662026 * pow(normalizedN3, 2)) + (0.0701367 * normalizedN3);
    double normalN1post = 0;
    for (int i = 0; i < 9; i++) {
      normalN1post += coefficients[i] * pow(normalizedN3, i);
    }

    // Return the calculated N1 value
    if (normalN1post >= normalN1pre) {
      return normalN1post * idleN1;
    } else {
      return normalN1pre * idleN1;
    }
  }

  /**
   * @brief Calculates the Fuel Flow (Kg/hr) during engine startup.
   *
   * This function calculates the Fuel Flow, which represents the rate of fuel consumption during the engine startup process.
   * The calculation is based on the current N3 value, the idle N3 value, and the idle Fuel Flow value.
   *
   * @param fbwN3 The current N3 value in percent.
   * @param idleN3 The idle N3 value in percent.
   * @param idleFF The idle Fuel Flow value in Kg/hr.
   * @return The calculated Fuel Flow value in Kg/hr.
   */
  static double startFF(double fbwN3, double idleN3, double idleFF) {
    // Normalize the current N3 value
    double normalizedN3 = fbwN3 / idleN3;

    // Initialize the normalized Fuel Flow value
    double normalizedFF = 0;

    // Coefficients for the polynomial calculation
    double coefficients[9] = {3.1110282e-12, 1.0804331e+02,  -1.3972629e+03, 7.4874131e+03, -2.1511983e+04,
                              3.5957757e+04, -3.5093994e+04, 1.8573033e+04,  -4.1220062e+03};

    // Calculate the normalized Fuel Flow value using a polynomial model if the normalized N3 value is greater than 0.37
    if (normalizedN3 > 0.37) {
      for (int i = 0; i < 9; i++) {
        normalizedFF += coefficients[i] * pow(normalizedN3, i);
      }
    }

    // Ensure the calculated normalized Fuel Flow value is non-negative
    if (normalizedFF < 0) {
      normalizedFF = 0;
    }

    // Return the calculated Fuel Flow value
    return normalizedFF * idleFF;
  }

  /**
   * @brief Calculates the Exhaust Gas Temperature (EGT) during engine startup.
   *
   * This function calculates the EGT, which represents the temperature of the exhaust gas during the engine startup process.
   * The calculation is based on the current N3 value, the idle N3 value, the ambient temperature, and the idle EGT value.
   *
   * @param fbwN3 The current N3 value in percent.
   * @param idleN3 The idle N3 value in percent.
   * @param ambientTemp The ambient temperature in degrees Celsius.
   * @param idleEGT The idle EGT value in degrees Celsius.
   * @return The calculated EGT value in degrees Celsius.
   */
  static double startEGT(double fbwN3, double idleN3, double ambientTemp, double idleEGT) {
    // Normalize the current N3 value
    double normalizedN3 = fbwN3 / idleN3;

    // Initialize the normalized EGT value
    double normalizedEGT = 0;

    // Calculate the normalized EGT value based on the normalized N3 value
    if (normalizedN3 < 0.17) {
      normalizedEGT = 0;
    } else if (normalizedN3 <= 0.4) {
      normalizedEGT = (0.04783 * normalizedN3) - 0.00813;
    } else {
      // Coefficients for the polynomial calculation
      double egtCoefficients[9] = {-6.8725167e+02, 7.7548864e+03,  -3.7507098e+04, 1.0147016e+05, -1.6779273e+05,
                                   1.7357157e+05,  -1.0960924e+05, 3.8591956e+04,  -5.7912600e+03};

      // Calculate the normalized EGT value using a polynomial model
      for (int i = 0; i < 9; i++) {
        normalizedEGT += egtCoefficients[i] * pow(normalizedN3, i);
      }
    }

    // Calculate and return the EGT value
    return (normalizedEGT * (idleEGT - ambientTemp)) + ambientTemp;
  }

  /**
   * @brief Calculates the Oil Temperature (Celsius) during engine startup.
   *
   * This function calculates the Oil Temperature, which represents the temperature of the engine oil during the engine startup process.
   * The calculation is based on the current N3 value, the idle N3 value, and the ambient temperature.
   *
   * @param fbwN3 The current N3 value in percent.
   * @param idleN3 The idle N3 value in percent.
   * @param ambientTemp The ambient temperature in degrees Celsius.
   * @return The calculated Oil Temperature value in degrees Celsius.
   */
  static double startOilTemp(double fbwN3, double idleN3, double ambientTemp) {
    // Initialize the output Oil Temperature value
    double calculatedOilTemp;

    // Calculate the Oil Temperature value based on the current N3 value
    if (fbwN3 < 0.79 * idleN3) {
      calculatedOilTemp = ambientTemp;
    } else if (fbwN3 < 0.98 * idleN3) {
      calculatedOilTemp = ambientTemp + 5;
    } else {
      calculatedOilTemp = ambientTemp + 10;
    }

    return calculatedOilTemp;
  }

  /**
   * @brief Calculates the Corrected Exhaust Gas Temperature (EGT) in Celsius.
   *
   * This function calculates the Corrected EGT, which represents the temperature of the exhaust gas corrected for various factors.
   * The calculation is based on the corrected fan speed (cn1), corrected fuel flow (cff), Mach number (mach), and altitude (alt).
   *
   * @param cn1 The corrected fan speed in percent.
   * @param cff The corrected fuel flow in Kg/hr.
   * @param mach The Mach number.
   * @param alt The altitude in feet.
   * @return The calculated Corrected EGT value in Celsius.
   */
  static double correctedEGT(double cn1, double cff, double mach, double alt) {
    // Adjust the corrected fuel flow to account for the A380 double fuel flow. Will have to be taken care of.
    cff = cff / 2;

    // Coefficients for the polynomial calculation
    double c_EGT[16] = {3.2636e+02,  0.0000e+00, 9.2893e-01, 3.9505e-02,  3.9070e+02, -4.7911e-04, 7.7679e-03,  5.8361e-05,
                        -2.5566e+00, 5.1227e-06, 1.0178e-07, -7.4602e-03, 1.2106e-07, -5.1639e+01, -2.7356e-03, 1.9312e-08};

    // Calculate and return the Corrected EGT value using a polynomial model
    // clang-format off
    return c_EGT[0]
            + c_EGT[1]
            + (c_EGT[2] * cn1)
            + (c_EGT[3] * cff)
            + (c_EGT[4] * mach)
            + (c_EGT[5] * alt)
            + (c_EGT[6] * pow(cn1, 2))
            + (c_EGT[7] * cn1 * cff)
            + (c_EGT[8] * cn1 * mach)
            + (c_EGT[9] * cn1 * alt)
            + (c_EGT[10] * pow(cff, 2))
            + (c_EGT[11] * mach * cff)
            + (c_EGT[12] * cff * alt)
            + (c_EGT[13] * pow(mach, 2))
            + (c_EGT[14] * mach * alt)
            + (c_EGT[15] * pow(alt, 2));
    // clang-format on
  }

  /**
   * @brief Calculates the Corrected Fuel Flow (lbs/hr).
   *
   * This function calculates the Corrected Fuel Flow, which represents the rate of fuel consumption corrected for various factors.
   * The calculation is based on the corrected fan speed (cn1), Mach number (mach), and altitude (alt).
   *
   * @param cn1 The corrected fan speed in percent.
   * @param mach The Mach number.
   * @param alt The altitude in feet.
   * @return The calculated Corrected Fuel Flow value in lbs/hr.
   */
  double correctedFuelFlow(double cn1, double mach, double alt) {
    double c_Flow[21] = {-1.7630e+02, -2.1542e-01, 4.7119e+01,  6.1519e+02,  1.8047e-03, -4.4554e-01, -4.3940e+01,
                         4.0459e-05,  -3.2912e+01, -6.2894e-03, -1.2544e-07, 1.0938e-02, 4.0936e-01,  -5.5841e-06,
                         -2.3829e+01, 9.3269e-04,  2.0273e-11,  -2.4100e+02, 1.4171e-02, -9.5581e-07, 1.2728e-11};

    // clang-format off
    double outCFF = c_Flow[0]
                    + c_Flow[1]
                    + (c_Flow[2] * cn1)
                    + (c_Flow[3] * mach)
                    + (c_Flow[4] * alt)
                    + (c_Flow[5] * pow(cn1, 2))
                    + (c_Flow[6] * cn1 * mach)
                    + (c_Flow[7] * cn1 * alt)
                    + (c_Flow[8] * pow(mach, 2))
                    + (c_Flow[9] * mach * alt)
                    + (c_Flow[10] * pow(alt, 2))
                    + (c_Flow[11] * pow(cn1, 3))
                    + (c_Flow[12] * pow(cn1, 2) * mach)
                    + (c_Flow[13] * pow(cn1, 2) * alt)
                    + (c_Flow[14] * cn1 * pow(mach, 2))
                    + (c_Flow[15] * cn1 * mach * alt)
                    + (c_Flow[16] * cn1 * pow(alt, 2))
                    + (c_Flow[17] * pow(mach, 3))
                    + (c_Flow[18] * pow(mach, 2) * alt)
                    + (c_Flow[19] * mach * pow(alt, 2))
                    + (c_Flow[20] * pow(alt, 3));
    // clang-format on

    // Adjust the corrected fuel flow to account for the A380 double fuel flow. Will have to be taken care of.
    return 2 * outCFF;
  }

  /**
   * @brief Calculates the Oil Temperature (Celsius) during engine operation.
   *
   * This function calculates the Oil Temperature, which represents the temperature of the engine oil during the engine operation.
   * The calculation is based on the energy, previous oil temperature, maximum oil temperature, and the elapsed time.
   *
   * @param energy The energy in Joules.
   * @param preOilTemp The previous oil temperature in degrees Celsius.
   * @param maxOilTemp The maximum oil temperature in degrees Celsius.
   * @param deltaTime The elapsed time in seconds.
   * @return The calculated Oil Temperature value in degrees Celsius.
   */
  static double oilTemperature(double energy, double preOilTemp, double maxOilTemp, double deltaTime) {
    // Initialize the steady temperature and the decay constant
    double k = 0.001;

    // Calculate the change in temperature due to the energy
    double dt = energy * deltaTime * 0.002;

    // Calculate the steady temperature based on the maximum oil temperature, the decay constant, and the previous oil temperature
    double t_steady = ((maxOilTemp * k * deltaTime) + preOilTemp) / (1 + (k * deltaTime));

    // Calculate the oil temperature based on the steady temperature and the change in temperature
    double oilTemp_out;
    if (t_steady - dt >= maxOilTemp) {
      oilTemp_out = maxOilTemp;
    } else if (t_steady - dt >= maxOilTemp - 10) {
      oilTemp_out = (t_steady - dt) * 0.999997;
    } else {
      oilTemp_out = (t_steady - dt);
    }

    // Return the calculated oil temperature
    return oilTemp_out;
  }

  /**
   * @brief Calculates the Oil Gulping percentage.
   *
   * This function calculates the Oil Gulping percentage, which represents the percentage of oil gulping during engine operation.
   * The calculation is based on the thrust.
   *
   * @param thrust The thrust in Newton.
   * @return The calculated Oil Gulping percentage.
   */
  static double oilGulpPct(double thrust) {
    // Initialize the output Oil Gulping percentage
    double oilGulpPercentage = 0;

    // Coefficients for the polynomial calculation
    double oilGulpCoefficients[3] = {20.1968848, -1.2270302e-4, 1.78442e-8};

    // Calculate the Oil Gulping percentage using a polynomial model
    oilGulpPercentage = oilGulpCoefficients[0] + (oilGulpCoefficients[1] * thrust) + (oilGulpCoefficients[2] * pow(thrust, 2));

    // Return the calculated Oil Gulping percentage
    return oilGulpPercentage / 100;
  }

  /**
   * @brief Calculates the Oil Pressure (PSI).
   *
   * This function calculates the Oil Pressure, which represents the pressure of the engine oil.
   * The calculation is based on the simulated N3 value.
   *
   * @param simN3 The simulated N3 value in percent.
   * @return The calculated Oil Pressure value in PSI.
   */
  static double oilPressure(double simN3) {
    // Coefficients for the polynomial calculation
    double oilPressureCoefficients[3] = {-0.88921, 0.23711, 0.00682};

    // Calculate and return the Oil Pressure value using a polynomial model
    return oilPressureCoefficients[0] + (oilPressureCoefficients[1] * simN3) + (oilPressureCoefficients[2] * pow(simN3, 2));
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_POLYNOMIAL_H
