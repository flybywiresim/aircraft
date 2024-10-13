#ifndef FLYBYWIRE_AIRCRAFT_POLYNOMIAL_A32NX_HPP
#define FLYBYWIRE_AIRCRAFT_POLYNOMIAL_A32NX_HPP

#include <algorithm>
#include <cmath>
#include <numeric>

/**
 * @brief Class representing a collection of multi-variate regression polynomials for engine parameters.
 *
 * This class contains static methods for calculating various engine parameters based on multi-variate
 * regression polynomials. These parameters include N2, N1, EGT, Fuel Flow, Oil Temperature,
 * and Oil Pressure during different engine states such as shutdown and startup. The class also
 * includes methods for calculating corrected EGT and Fuel Flow, as well as Oil Gulping percentage.
 */
class Polynomial_A32NX {
 public:
  /**
   * @brief Calculates the N2 percentage during engine start-up using real-life modeled polynomials.
   *
   * @param n2 The current N2 percentage.
   * @param preN2 The previous N2 percentage.
   * @param idleN2 The idle N2 percentage.
   * @return The calculated N2 percentage.
   */
  static double startN2(double n2, double preN2, double idleN2) {
    // Normalize the current N2 percentage by scaling it with the idle N2
    // percentage and a constant factor.
    // The constant factor 68.2 is likely derived from empirical data or a mathematical model of the
    // engine's behavior.
    double normalN2 = n2 * 68.2 / idleN2;

    // Coefficients for the polynomial used to calculate the N2 percentage.
    constexpr double c_N2[16] = {
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

    // Calculate the N2 percentage using the polynomial equation.
    double outN2 = 0.0;
    for (int i = 0; i < 16; ++i) {
      outN2 += c_N2[i] * (std::pow)(normalN2, i);
    }

    outN2 *= n2;
    outN2 = (std::max)(outN2, preN2 + 0.002);
    return (std::min)(outN2, idleN2 + 0.1);
  }

  /**
   * @brief Calculates the N1 percentage during engine start-up.
   *
   * @param fbwN2 The current custom N2 percentage.
   * @param idleN2 The idle N2 percentage.
   * @param idleN1 The idle N1 percentage.
   * @return The calculated N1 percentage.
   */
  static double startN1(double fbwN2, double idleN2, double idleN1) {
    // Normalize the current N2 percentage by dividing it with the idle N2 percentage.
    const double normalN2 = fbwN2 / idleN2;

    // Coefficients for the polynomial used to calculate the N1 percentage.
    constexpr double c_N1[9] = {
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

    // Calculate the N1 percentage using the polynomial equation.
    const double normalN1pre = (-2.4698087 * (std::pow)(normalN2, 3))   //
                               + (0.9662026 * (std::pow)(normalN2, 2))  //
                               + (0.0701367 * normalN2);                //

    // Calculate the N2 percentage using the polynomial equation.
    double normalN1post = 0.0;
    for (int i = 0; i < 9; ++i) {
      normalN1post += c_N1[i] * (std::pow)(normalN2, i);
    }

    // Return the calculated N1 percentage, ensuring it is within the range [normalN1pre, normalN1post]
    // and then multiplied by idleN1.
    return (normalN1post >= normalN1pre ? normalN1post : normalN1pre) * idleN1;
  }

  /**
   * @brief Calculates the Fuel Flow (FF) during engine start-up using real-life modeled polynomials.
   *
   * @param fbwN2 The current N2 percentage.
   * @param idleN2 The idle N2 percentage.
   * @param idleFF The idle FF.
   * @return The calculated FF.
   */
  static double startFF(double fbwN2, double idleN2, double idleFF) {
    const double normalN2 = fbwN2 / idleN2;
    double       normalFF = 0;

    // If the normalized N2 percentage is less than or equal to 0.37, the FF is 0.
    if (normalN2 <= 0.37) {
      normalFF = 0;
    } else {
      // Coefficients for the polynomial used to calculate the FF.
      constexpr double c_FF[9] = {
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
      // Calculate the FF using the polynomial equation.
      for (int i = 0; i < 9; ++i) {
        normalFF += c_FF[i] * (std::pow)(normalN2, i);
      }
    }

    // Return the calculated FF, ensuring it is not less than 0.0 and then multiplied by idleFF.
    return (std::max)(normalFF, 0.0) * idleFF;
  }

  /**
   * @brief Calculates the Exhaust Gas Temperature (EGT) during engine start-up using real-life modeled polynomials.
   *
   * @param fbwN2 The current N2 percentage.
   * @param idleN2 The idle N2 percentage.
   * @param ambientTemp The ambient temperature.
   * @param idleEGT The idle EGT.
   * @return The calculated EGT.
   */
  static double startEGT(double fbwN2, double idleN2, double ambientTemp, double idleEGT) {
    // Normalize the current N2 percentage by dividing it with the idle N2 percentage.
    const double normalizedN2 = fbwN2 / idleN2;

    // Calculate the normalized EGT value based on the normalized N2 value
    double normalizedEGT;
    if (normalizedN2 < 0.17) {
      normalizedEGT = 0;
    }
    // If the normalized N2 percentage is less than or equal to 0.4, the EGT is calculated using a linear equation.
    else if (normalizedN2 <= 0.4) {
      normalizedEGT = (0.04783 * normalizedN2) - 0.00813;
    }
    // If the normalized N2 percentage is greater than 0.4, the EGT is calculated using a polynomial equation.
    else {
      // Coefficients for the polynomial used to calculate the EGT.
      constexpr double c_EGT[9] = {
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

      // Calculate the EGT using the polynomial equation.
      normalizedEGT = 0.0;
      for (int i = 0; i < 9; ++i) {
        normalizedEGT += c_EGT[i] * (std::pow)(normalizedN2, i);
      }
    }

    // Return the calculated EGT, ensuring it is within the range [ambientTemp, idleEGT].
    return (normalizedEGT * (idleEGT - (ambientTemp))) + (ambientTemp);
  }

  /**
   * @brief Calculates the Oil Temperature during engine start-up.
   *
   * @param fbwN2 The current custom N2 percentage.
   * @param idleN2 The custom idle N2 percentage.
   * @param ambientTemperature The ambient temperature.
   * @return The calculated Oil Temperature.
   */
  static double startOilTemp(double fbwN2, double idleN2, double ambientTemperature) {
    if (fbwN2 < 0.79 * idleN2) {
      return ambientTemperature;
    }
    if (fbwN2 < 0.98 * idleN2) {
      return ambientTemperature + 5;
    }
    return ambientTemperature + 10;
  }

  /**
   * @brief Calculates the N2 percentage during engine shutdown.
   *
   * @param previousN2 The previous N2 percentage.
   * @param deltaTime The elapsed time since the last calculation in seconds.
   * @return The calculated N2 percentage.
   */
  static double shutdownN2(double previousN2, double deltaTime) {
    // The decayRate is used to model the rate at which the N2 percentage decreases during the engine
    // shutdown process.
    // The specific values -0.0515 and -0.08183 are likely derived from empirical
    // data or a mathematical model of the engine's behavior.
    // The choice to use a different decay rate for 'previousN2' values below 30 suggests that the
    // engine's shutdown behavior changes at this threshold.
    double decayRate = previousN2 < 30 ? -0.0515 : -0.08183;
    return previousN2 * (std::exp)(decayRate * deltaTime);
  }

  /**
   * @brief Calculates the N1 percentage during engine shutdown.
   *
   * @param previousN1 The previous N1 percentage.
   * @param deltaTime The elapsed time since the last calculation.
   * @return The calculated N1 percentage.
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
    constexpr double c_EGT[16] = {
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
           + (c_EGT[15] * (std::pow)(alt, 2));
  }

  /**
   * @brief Calculates the customer corrected fuel flow based on cn1, mach, and altitude based on
   *        real-life modeled polynomials.
   *
   * @param cn1 The corrected fan speed.
   * @param mach The Mach number.
   * @param alt The altitude.
   * @return The calculated corrected fuel flow in pounds per hour.
   */
  static double correctedFuelFlow(double cn1, double mach, double alt) {
    constexpr double c_Flow[21] = {
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

    return c_Flow[0]                                   //
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
           + (c_Flow[20] * (std::pow)(alt, 3));
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
    // these constants are likely derived from empirical data or a mathematical model of the engine's behavior
    // they were not documented in the original code, and their names here are inferred from their usage
    const double heatTransferCoefficient  = 0.001;
    const double energyScalingFactor      = 0.002;
    const double temperatureThreshold     = 10;
    const double temperatureScalingFactor = 0.999997;

    const double changeInThermalEnergy = thermalEnergy * deltaTime * energyScalingFactor;
    const double steadyStateTemp =
        ((maxOilTemperature * heatTransferCoefficient * deltaTime) + previousOilTemp) / (1 + (heatTransferCoefficient * deltaTime));

    const double newTemp = steadyStateTemp - changeInThermalEnergy;
    if (newTemp >= maxOilTemperature) {
      return maxOilTemperature;
    } else if (newTemp >= maxOilTemperature - temperatureThreshold) {
      return newTemp * temperatureScalingFactor;
    } else {
      return newTemp;
    }
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
    const double outOilGulpPct =
        oilGulpCoefficients[0] + (oilGulpCoefficients[1] * thrust) + (oilGulpCoefficients[2] * (std::pow)(thrust, 2));
    return outOilGulpPct / 100;
  }

  /**
   * @brief Calculates the Oil Pressure (PSI) based on simulated N2 value.
   *        Real-life modeled polynomials - Oil Pressure (PSI)
   * @param simN2 The simulated N2 value in percent.
   * @return The calculated Oil Pressure value in PSI.
   */
  static double oilPressure(double simN2) {
    const double oilPressureCoefficients[3] = {-0.88921, 0.23711, 0.00682};
    return oilPressureCoefficients[0] + (oilPressureCoefficients[1] * simN2) + (oilPressureCoefficients[2] * (std::pow)(simN2, 2));
  }
};

#endif  // FLYBYWIRE_AIRCRAFT_POLYNOMIAL_A32NX_HPP
