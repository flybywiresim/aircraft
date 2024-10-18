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
 *
 * TODO: Many of the values/polynomials used in these methods are identical to the A32NX values and
 *       likely need to be adjusted to match the A380X engine model.
 */
class Polynomial_A380X {
 public:
  /**
   * @brief Calculates the N3 value during engine startup using real-life modeled polynomials.
   *
   * @param currentSimN3 The current N3 value in percent (taken from the sim's N2 value).
   * @param previousN3 The previous N3 value in percent.
   * @param idleN3 The idle N3 value in percent.
   * @return The calculated N3 value in percent.
   */
  static double startN3(double currentSimN3, double previousN3, double idleN3) {
    // Normalize the current N3 percentage by scaling it with the idle N3
    // percentage and a constant factor.
    // The constant factor 60.0 is likely derived from empirical data or a mathematical model of the
    // engine's behavior.
    double normalizedN3 = currentSimN3 * 60.0 / idleN3;

    // Coefficients for the polynomial used to calculate the N3 percentage.
    constexpr double coefficients[16] = {
        4.03649879e+00,   // coefficient for x^0
        -9.41981960e-01,  // coefficient for x^1
        1.98426614e-01,   // coefficient for x^2
        -2.11907840e-02,  // coefficient for x^3
        1.00777507e-03,   // coefficient for x^4
        -1.57319166e-06,  // coefficient for x^5
        -2.15034888e-06,  // coefficient for x^6
        1.08288379e-07,   // coefficient for x^7
        -2.48504632e-09,  // coefficient for x^8
        2.52307089e-11,   // coefficient for x^9
        -2.06869243e-14,  // coefficient for x^10
        8.99045761e-16,   // coefficient for x^11
        -9.94853959e-17,  // coefficient for x^12
        1.85366499e-18,   // coefficient for x^13
        -1.44869928e-20,  // coefficient for x^14
        4.31033031e-23    // coefficient for x^15
    };

    // Calculate the N3 value during engine startup using a polynomial model
    double outN3 = 0;
    for (int i = 0; i < 16; i++) {
      outN3 += coefficients[i] * (std::pow)(normalizedN3, i);
    }
    outN3 *= currentSimN3;

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
   * @param fbwN3 The current custom N3 value in percent.
   * @param idleN3 The idle N3 value in percent.
   * @param idleN1 The idle N1 value in percent.
   * @return The calculated N1 value in percent.
   */
  static double startN1(double fbwN3, double idleN3, double idleN1) {
    // Normalize the current N3 value
    double normalizedN3 = fbwN3 / idleN3;

    // Coefficients for the polynomial used to calculate the N1 percentage.
    constexpr double coefficients[9] = {
        -2.2812156e-12,  // coefficient for x^0
        -5.9830374e+01,  // coefficient for x^1
        7.0629094e+02,   // coefficient for x^2
        -3.4580361e+03,  // coefficient for x^3
        9.1428923e+03,   // coefficient for x^4
        -1.4097740e+04,  // coefficient for x^5
        1.2704110e+04,   // coefficient for x^6
        -6.2099935e+03,  // coefficient for x^7
        1.2733071e+03    // coefficient for x^8
    };

    // Calculate the N1 value during engine startup using a polynomial model
    double normalN1pre =
        (-2.4698087 * (std::pow)(normalizedN3, 3)) + (0.9662026 * (std::pow)(normalizedN3, 2)) + (0.0701367 * normalizedN3);
    double normalN1post = 0;
    for (int i = 0; i < 9; i++) {
      normalN1post += coefficients[i] * (std::pow)(normalizedN3, i);
    }

    // Return the calculated N1 value
    if (normalN1post >= normalN1pre) {
      return normalN1post * idleN1;
    } else {
      return normalN1pre * idleN1;
    }
  }

  /**
   * @brief Calculates the Fuel Flow (Kg/hr) during engine startup using real-life modeled polynomials.
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
    constexpr double coefficients[9] = {
        3.1110282e-12,   // coefficient for x^0
        1.0804331e+02,   // coefficient for x^1
        -1.3972629e+03,  // coefficient for x^2
        7.4874131e+03,   // coefficient for x^3
        -2.1511983e+04,  // coefficient for x^4
        3.5957757e+04,   // coefficient for x^5
        -3.5093994e+04,  // coefficient for x^6
        1.8573033e+04,   // coefficient for x^7
        -4.1220062e+03   // coefficient for x^8
    };

    // Calculate the normalized Fuel Flow value using a polynomial model if the normalized N3 value is greater than 0.37
    if (normalizedN3 > 0.37) {
      for (int i = 0; i < 9; i++) {
        normalizedFF += coefficients[i] * (std::pow)(normalizedN3, i);
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
   * @brief Calculates the Exhaust Gas Temperature (EGT) during engine startup using real-life modeled polynomials.
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

    // Calculate the normalized EGT value based on the normalized N3 value
    double normalizedEGT = 0;
    if (normalizedN3 < 0.17) {
      normalizedEGT = 0;
    } else if (normalizedN3 <= 0.4) {
      normalizedEGT = (0.04783 * normalizedN3) - 0.00813;
    } else {
      // Coefficients for the polynomial calculation
      double egtCoefficients[9] = {
          -6.8725167e+02,  // coefficient for x^0
          7.7548864e+03,   // coefficient for x^1
          -3.7507098e+04,  // coefficient for x^2
          1.0147016e+05,   // coefficient for x^3
          -1.6779273e+05,  // coefficient for x^4
          1.7357157e+05,   // coefficient for x^5
          -1.0960924e+05,  // coefficient for x^6
          3.8591956e+04,   // coefficient for x^7
          -5.7912600e+03   // coefficient for x^8
      };

      // Calculate the normalized EGT value using a polynomial model
      for (int i = 0; i < 9; i++) {
        normalizedEGT += egtCoefficients[i] * (std::pow)(normalizedN3, i);
      }
    }

    // Calculate and return the EGT value
    return (normalizedEGT * (idleEGT - ambientTemp)) + ambientTemp;
  }

  /**
   * @brief Calculates the Oil Temperature during engine start-up.
   *
   * @param fbwN3 The current custom N3 percentage.
   * @param idleN3 The custom idle N3 percentage.
   * @param ambientTemperature The ambient temperature.
   * @return The calculated Oil Temperature.
   */
  static double startOilTemp(double fbwN3, double idleN3, double ambientTemperature) {
    if (fbwN3 < 0.79 * idleN3) {
      return ambientTemperature;
    }
    if (fbwN3 < 0.98 * idleN3) {
      return ambientTemperature + 5;
    }
    return ambientTemperature + 10;
  }

  /**
   * @brief Calculates the N3 value during engine shutdown.
   *
   * @param previousN3 The previous N3 value in percent.
   * @param deltaTime The elapsed time since the last update in seconds.
   * @return The calculated N3 value in percent.
   */
  static double shutdownN3(double previousN3, double deltaTime) {
    // The decayRate is used to model the rate at which the N3 percentage decreases during the engine
    // shutdown process.
    // The specific values -0.0515 and -0.08183 are likely derived from empirical
    // data or a mathematical model of the engine's behavior.
    // The choice to use a different decay rate for 'previousN2' values below 30 suggests that the
    // engine's shutdown behavior changes at this threshold.
    double decayRate = previousN3 < 30 ? -0.0515 : -0.08183;
    return previousN3 * (std::exp)(decayRate * deltaTime);
  }

  /**
   * @brief Calculates the N1 value during engine shutdown.
   *
   * @param previousN1 The previous N1 value in percent.
   * @param deltaTime The elapsed time since the last update in seconds.
   * @return The calculated N1 value in percent.
   */
  static double shutdownN1(double previousN1, double deltaTime) {
    // The decayRate is used to model the rate at which the N1 percentage decreases during the engine
    // shutdown process.
    // The specific values -0.08 and -0.164 are likely derived from empirical data or a mathematical
    // model of the engine's behavior. The choice to use a different decay rate for 'previousN1' values
    // below 4 suggests that the engine's shutdown behavior changes at this threshold.
    double decayRate = previousN1 < 4 ? -0.08 : -0.164;
    return previousN1 * exp(decayRate * deltaTime);
  }

  /**
   * @brief Calculates the Exhaust Gas Temperature (EGT) during engine shutdown.
   *
   * @param previousEGT The previous EGT value in degrees Celsius.
   * @param ambientTemp The ambient temperature in degrees Celsius.
   * @param deltaTime The elapsed time since the last update in seconds.
   * @return The calculated EGT value in degrees Celsius.
   */
  static double shutdownEGT(double previousEGT, double ambientTemp, double deltaTime) {
    // The specific values used (140, 0.0257743, 135, 0.00072756, and 30) are likely derived from empirical
    // data or a mathematical model of the engine's behavior.
    // The choice to use different decay rates and steady state temperatures based on the previous
    // EGT suggests that the engine's shutdown behavior changes at this threshold.
    double threshold       = ambientTemp + 140;
    double decayRate       = previousEGT > threshold ? 0.0257743 : 0.00072756;
    double steadyStateTemp = previousEGT > threshold ? 135 + ambientTemp : 30 + ambientTemp;
    return steadyStateTemp + (previousEGT - steadyStateTemp) * exp(-decayRate * deltaTime);
  }

  /**
   * @brief Calculates the corrected Exhaust Gas Temperature (EGT) based on corrected fan speed,
   *        corrected fuel flow, Mach number, and altitude. Real-life modeled polynomials.
   *
   * @param cn1 The corrected fan speed in percent.
   * @param cff The corrected fuel flow in pounds per hour.
   * @param mach The Mach number.
   * @param alt The altitude in feet.
   * @return The calculated corrected EGT in Celsius.
   */
  static double correctedEGT(double cn1, double cff, double mach, double alt) {
    // TODO: Adjust the corrected fuel flow to account for the A380 double fuel flow. Will have to be taken care of.
    // Divide by 3 to lower EGT. Very hacky.
    cff = cff / 3;

    // Coefficients for the polynomial calculation
    double c_EGT[16] = {
        3.2636e+02,   // coefficient for x^0
        0.0000e+00,   // coefficient for x^1
        9.2893e-01,   // coefficient for x^2
        3.9505e-02,   // coefficient for x^3
        3.9070e+02,   // coefficient for x^4
        -4.7911e-04,  // coefficient for x^5
        7.7679e-03,   // coefficient for x^6
        5.8361e-05,   // coefficient for x^7
        -2.5566e+00,  // coefficient for x^8
        5.1227e-06,   // coefficient for x^9
        1.0178e-07,   // coefficient for x^10
        -7.4602e-03,  // coefficient for x^11
        1.2106e-07,   // coefficient for x^12
        -5.1639e+01,  // coefficient for x^13
        -2.7356e-03,  // coefficient for x^14
        1.9312e-08    // coefficient for x^15
    };

    // Calculate and return the Corrected EGT value using a polynomial model
    return c_EGT[0]                             //
           + c_EGT[1]                           //
           + (c_EGT[2] * cn1)                   //
           + (c_EGT[3] * cff)                   //
           + (c_EGT[4] * mach)                  //
           + (c_EGT[5] * alt)                   //
           + (c_EGT[6] * (std::pow)(cn1, 2))    //
           + (c_EGT[7] * cn1 * cff)             //
           + (c_EGT[8] * cn1 * mach)            //
           + (c_EGT[9] * cn1 * alt)             //
           + (c_EGT[10] * (std::pow)(cff, 2))   //
           + (c_EGT[11] * mach * cff)           //
           + (c_EGT[12] * cff * alt)            //
           + (c_EGT[13] * (std::pow)(mach, 2))  //
           + (c_EGT[14] * mach * alt)           //
           + (c_EGT[15] * (std::pow)(alt, 2));  //
  }

  /**
   * @brief Calculates the customer corrected fuel flow based on cn1, mach, and altitude based on
   *        real-life modeled polynomials.
   *
   * @param cn1 The corrected fan speed in percent.
   * @param mach The Mach number.
   * @param alt The altitude in feet.
   * @return The calculated Corrected Fuel Flow value in pounds per hour.
   */
  static double correctedFuelFlow(double cn1, double mach, double alt) {
    double c_Flow[21] = {
        -1.7630e+02,  // coefficient for x^0
        -2.1542e-01,  // coefficient for x^1
        4.7119e+01,   // coefficient for x^2
        6.1519e+02,   // coefficient for x^3
        1.8047e-03,   // coefficient for x^4
        -4.4554e-01,  // coefficient for x^5
        -4.3940e+01,  // coefficient for x^6
        4.0459e-05,   // coefficient for x^7
        -3.2912e+01,  // coefficient for x^8
        -6.2894e-03,  // coefficient for x^9
        -1.2544e-07,  // coefficient for x^10
        1.0938e-02,   // coefficient for x^11
        4.0936e-01,   // coefficient for x^12
        -5.5841e-06,  // coefficient for x^13
        -2.3829e+01,  // coefficient for x^14
        9.3269e-04,   // coefficient for x^15
        2.0273e-11,   // coefficient for x^16
        -2.4100e+02,  // coefficient for x^17
        1.4171e-02,   // coefficient for x^18
        -9.5581e-07,  // coefficient for x^19
        1.2728e-11    // coefficient for x^20
    };

    double outCFF = c_Flow[0]                                   //
                    + c_Flow[1]                                 //
                    + (c_Flow[2] * cn1)                         //
                    + (c_Flow[3] * mach)                        //
                    + (c_Flow[4] * alt)                         //
                    + (c_Flow[5] * (std::pow)(cn1, 2))          //
                    + (c_Flow[6] * cn1 * mach)                  //
                    + (c_Flow[7] * cn1 * alt)                   //
                    + (c_Flow[8] * (std::pow)(mach, 2))         //
                    + (c_Flow[9] * mach * alt)                  //
                    + (c_Flow[10] * (std::pow)(alt, 2))         //
                    + (c_Flow[11] * (std::pow)(cn1, 3))         //
                    + (c_Flow[12] * (std::pow)(cn1, 2) * mach)  //
                    + (c_Flow[13] * (std::pow)(cn1, 2) * alt)   //
                    + (c_Flow[14] * cn1 * (std::pow)(mach, 2))  //
                    + (c_Flow[15] * cn1 * mach * alt)           //
                    + (c_Flow[16] * cn1 * (std::pow)(alt, 2))   //
                    + (c_Flow[17] * (std::pow)(mach, 3))        //
                    + (c_Flow[18] * (std::pow)(mach, 2) * alt)  //
                    + (c_Flow[19] * mach * (std::pow)(alt, 2))  //
                    + (c_Flow[20] * (std::pow)(alt, 3));        //

    // TODO: Adjust the corrected fuel flow to account for the A380 double fuel flow. Will have to be taken care of.
    return 2.8 * outCFF;
  }

  /**
   * @brief Calculates the oil temperature based on energy, previous oil temperature, maximum oil temperature, and time interval.
   *
   * @param thermalEnergy The thermal energy in Joules.
   * @param previousOilTemp The previous oil temperature in Celsius.
   * @param maxOilTemperature The maximum oil temperature in Celsius.
   * @param deltaTime The time interval in seconds.
   * @return The calculated oil temperature in Celsius.
   *
   * TODO: Currently not used in the code.
   */
  static double oilTemperature(double thermalEnergy, double previousOilTemp, double maxOilTemperature, double deltaTime) {
    // Initialize the steady temperature and the decay constant
    double k = 0.001;

    // Calculate the change in temperature due to the energy
    double dt = thermalEnergy * deltaTime * 0.002;

    // Calculate the steady temperature based on the maximum oil temperature, the decay constant, and the previous oil temperature
    double t_steady = ((maxOilTemperature * k * deltaTime) + previousOilTemp) / (1 + (k * deltaTime));

    // Calculate the oil temperature based on the steady temperature and the change in temperature
    double oilTemp_out;
    if (t_steady - dt >= maxOilTemperature) {
      oilTemp_out = maxOilTemperature;
    } else if (t_steady - dt >= maxOilTemperature - 10) {
      oilTemp_out = (t_steady - dt) * 0.999997;
    } else {
      oilTemp_out = (t_steady - dt);
    }

    // Return the calculated oil temperature
    return oilTemp_out;
  }

  /**
   * @brief Calculates the Oil Gulping percentage based on thrust.
   *        Real-life modeled polynomials - Oil Gulping (%)
   *
   * @param thrust The thrust in Newton.
   * @return The calculated Oil Gulping percentage.
   */
  static double oilGulpPct(double thrust) {
    const double oilGulpCoefficients[3] = {20.1968848, -1.2270302e-4, 1.78442e-8};
    const double oilGulpPercentage =
        oilGulpCoefficients[0] + (oilGulpCoefficients[1] * thrust) + (oilGulpCoefficients[2] * (std::pow)(thrust, 2));
    return oilGulpPercentage / 100;
  }

  /**
   * @brief Calculates the Oil Pressure (PSI) based on simulated N3 value.
   *        Real-life modeled polynomials - Oil Pressure (PSI)
   *
   * @param simN3 The simulated N3 value in percent.
   * @return The calculated Oil Pressure value in PSI.
   */
  static double oilPressure(double simN3) {
    double oilPressureCoefficients[3] = {-0.88921, 0.23711, 0.00682};
    return oilPressureCoefficients[0] + (oilPressureCoefficients[1] * simN3) + (oilPressureCoefficients[2] * (std::pow)(simN3, 2));
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_POLYNOMIAL_H
