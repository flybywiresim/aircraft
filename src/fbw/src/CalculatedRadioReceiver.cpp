#include "CalculatedRadioReceiver.h"
#include <cmath>
#include <iostream>

RadioReceiver::RadioReceiver() {
  this->cached_gs_deg = 0;
}

RadioReceiverResult RadioReceiver::calculateLocalizerDeviation(bool loc_valid,
                                                               double loc_deg,
                                                               double loc_magvar_deg,
                                                               double loc_position_lat,
                                                               double loc_position_lon,
                                                               double loc_position_alt,
                                                               double aircraft_position_lat,
                                                               double aircraft_position_lon,
                                                               double aircraft_position_alt) {
  // conversion
  double Phi1 = deg2rad(aircraft_position_lat);
  double Phi2 = deg2rad(loc_position_lat);
  double Gamma1 = deg2rad(aircraft_position_lon);
  double Gamma2 = deg2rad(loc_position_lon);

  // deltas
  double deltaPhi = deg2rad(loc_position_lat - aircraft_position_lat);
  double deltaGamma = deg2rad(loc_position_lon - aircraft_position_lon);

  // calculate distance
  // NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
  double a = sin(deltaPhi / 2.0) * sin(deltaPhi / 2.0) + cos(Phi1) * cos(Phi2) * sin(deltaGamma / 2.0) * sin(deltaGamma / 2.0);
  // NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
  double c = 2.0 * atan2(sqrt(a), sqrt(1.0 - a));

  double distance_m = EARTH_RADIUS_METER * c;  // meters
  // NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
  distance_m = sqrt(pow(distance_m, 2.0) + pow(aircraft_position_alt - loc_position_alt, 2.0));
  // NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
  double distance = distance_m / 1852.0;  // in nm

  // calculate bearing
  double y = sin(Gamma2 - Gamma1) * cos(Phi2);
  double x = cos(Phi1) * sin(Phi2) - sin(Phi1) * cos(Phi2) * cos(Gamma2 - Gamma1);
  double Theta = atan2(y, x);
  // NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
  double bearing = fmod((rad2deg(Theta) + 360.0), 360.0);  // in degrees

  // calculate deviation
  // NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
  double mag_var = headingDifference(360.0, loc_magvar_deg);
  double deviation = headingDifference(headingNormalize(loc_deg - mag_var), bearing);

  bool isValid = false;
  double error = 0;
  double dme = 0;

  // NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
  if ((abs(distance) < 30.0) && abs(headingDifference(loc_deg, bearing)) < 90.0 &&
      (loc_position_lat != 0 || loc_position_lon != 0 || loc_position_alt != 0)) {
    isValid = true;
    error = deviation;
    dme = distance;
  }

  // result variable
  return RadioReceiverResult{isValid, dme, bearing, error};
}

RadioReceiverResult RadioReceiver::calculateGlideSlopeDeviation(bool gs_valid,
                                                                double log_deg,
                                                                double gs_deg,
                                                                double gs_position_lat,
                                                                double gs_position_lon,
                                                                double gs_position_alt,
                                                                double aircraft_position_lat,
                                                                double aircraft_position_lon,
                                                                double aircraft_position_alt) {
  // cache gs_deg
  if (gs_valid) {
    cached_gs_deg = gs_deg;
  } else {
    gs_deg = cached_gs_deg;
  }

  // conversion
  double Phi1 = deg2rad(aircraft_position_lat);
  double Phi2 = deg2rad(gs_position_lat);
  double Gamma1 = deg2rad(aircraft_position_lon);
  double Gamma2 = deg2rad(gs_position_lon);

  // deltas
  double deltaPhi = deg2rad(gs_position_lat - aircraft_position_lat);
  double deltaGamma = deg2rad(gs_position_lon - aircraft_position_lon);

  // calculate distance
  // NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
  double a = sin(deltaPhi / 2.0) * sin(deltaPhi / 2.0) + cos(Phi1) * cos(Phi2) * sin(deltaGamma / 2.0) * sin(deltaGamma / 2.0);
  // NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
  double c = 2.0 * atan2(sqrt(a), sqrt(1.0 - a));

  double distance_m = EARTH_RADIUS_METER * c;  // meters
  // NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
  distance_m = sqrt(pow(distance_m, 2.0) + pow(aircraft_position_alt - gs_position_alt, 2.0));
  // NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
  double distance = distance_m / 1852.0;  // in nm

  // calculate bearing
  double y = sin(Gamma2 - Gamma1) * cos(Phi2);
  double x = cos(Phi1) * sin(Phi2) - sin(Phi1) * cos(Phi2) * cos(Gamma2 - Gamma1);
  double Theta = atan2(y, x);
  // NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
  double bearing = fmod((rad2deg(Theta) + 360.0), 360.0);  // in degrees

  // calculate deviation
  double deviation = rad2deg(asin((aircraft_position_alt - gs_position_alt) / distance_m)) - gs_deg;

  bool isValid = false;
  double error = 0;
  double dme = 0;

  // NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
  if ((abs(distance) < 30.0) && abs(headingDifference(log_deg, bearing)) < 90.0 &&
      (gs_position_lat != 0 || gs_position_lon != 0 || gs_position_alt != 0)) {
    isValid = true;
    error = deviation;
    dme = distance;
  }

  // result variable
  return RadioReceiverResult{isValid, dme, bearing, error};
}

double RadioReceiver::headingNormalize(double u) {
  // NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
  return fmod(fmod(u, 360.0) + 360.0, 360.0);
}

double RadioReceiver::headingDifference(double u1, double u2) {
  // normalize headings
  u1 = headingNormalize(u1);
  u2 = headingNormalize(u2);

  // calculate shortest path
  // NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
  double L = fmod(u1 - (u2 + 360.0) + 360.0, 360.0);
  // NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
  double R = fmod(360.0 - L, 360.0);
  if (abs(L) < abs(R)) {
    return -1.0 * L;
  } else {
    return R;
  }
}

double RadioReceiver::deg2rad(double degrees) {
  // NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
  return (degrees * M_PI) / 180.0;
}

double RadioReceiver::rad2deg(double radians) {
  // NOLINTNEXTLINE(cppcoreguidelines-avoid-magic-numbers)
  return (radians * 180.0) / M_PI;
}
