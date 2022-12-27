#pragma once

struct RadioReceiverResult {
  bool isValid;
  double distance;
  double bearing;
  double deviation;
};

class RadioReceiver {
 public:
  RadioReceiver();

  RadioReceiverResult calculateLocalizerDeviation(bool loc_valid,
                                                  double loc_deg,
                                                  double loc_magvar_deg,
                                                  double loc_position_lat,
                                                  double loc_position_lon,
                                                  double loc_position_alt,
                                                  double aircraft_position_lat,
                                                  double aircraft_position_lon,
                                                  double aircraft_position_alt);

  RadioReceiverResult calculateGlideSlopeDeviation(bool gs_valid,
                                                   double log_deg,
                                                   double gs_deg,
                                                   double gs_position_lat,
                                                   double gs_position_lon,
                                                   double gs_position_alt,
                                                   double aircraft_position_lat,
                                                   double aircraft_position_lon,
                                                   double aircraft_position_alt);

 private:
  static constexpr double EARTH_RADIUS_METER = 6371e3;

  double cached_gs_deg;

  double headingNormalize(double u);
  double headingDifference(double u1, double u2);
  double deg2rad(double degrees);
  double rad2deg(double radians);
};
