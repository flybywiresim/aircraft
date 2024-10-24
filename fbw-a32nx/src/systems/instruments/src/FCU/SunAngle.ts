// Based on ftp://climate1.gsfc.nasa.gov/wiscombe/Solar_Rad/SunAngles/sunae.f
//
//     Calculates the local solar azimuth and elevation angles, and
//     the distance to and angle subtended by the Sun, at a specific
//     location and time using approximate formulas in The Astronomical
//     Almanac.  Accuracy of angles is 0.01 deg or better (the angular
//     width of the Sun is about 0.5 deg, so 0.01 deg is more than
//     sufficient for most applications).

//     Unlike many GCM (and other) sun angle routines, this
//     one gives slightly different sun angles depending on
//     the year.  The difference is usually down in the 4th
//     significant digit but can slowly creep up to the 3rd
//     significant digit after several decades to a century.

//     A refraction correction appropriate for the "US Standard
//     Atmosphere" is added, so that the returned sun position is
//     the APPARENT one.  The correction is below 0.1 deg for solar
//     elevations above 9 deg.  To remove it, comment out the code
//     block where variable REFRAC is set, and replace it with
//     REFRAC = 0.0.

//   References:

//     Michalsky, J., 1988: The Astronomical Almanac's algorithm for
//        approximate solar position (1950-2050), Solar Energy 40,
//        227-235 (but the version of this program in the Appendix
//        contains errors and should not be used)

//     The Astronomical Almanac, U.S. Gov't Printing Office, Washington,
//        D.C. (published every year): the formulas used from the 1995
//        version are as follows:
//        p. A12: approximation to sunrise/set times
//        p. B61: solar elevation ("altitude") and azimuth
//        p. B62: refraction correction
//        p. C24: mean longitude, mean anomaly, ecliptic longitude,
//                obliquity of ecliptic, right ascension, declination,
//                Earth-Sun distance, angular diameter of Sun
//        p. L2:  Greenwich mean sidereal time (ignoring T^2, T^3 terms)

//   Authors:  Dr. Joe Michalsky (joe@asrc.albany.edu)
//             Dr. Lee Harrison (lee@asrc.albany.edu)
//             Atmospheric Sciences Research Center
//             State University of New York
//             Albany, New York

//   Modified by:  Dr. Warren Wiscombe (wiscombe@climate.gsfc.nasa.gov)
//                 NASA Goddard Space Flight Center
//                 Code 913
//                 Greenbelt, MD 20771

//   WARNING:  Do not use this routine outside the year range
//             1950-2050.  The approximations become increasingly
//             worse, and the calculation of Julian date becomes
//             more involved.

//   Input:

//      YEAR     year (INTEGER; range 1950 to 2050)

//      DAY      day of year at LAT-LONG location (INTEGER; range 1-366)

//      HOUR     hour of DAY [GMT or UT] (REAL; range -13.0 to 36.0)
//               = (local hour) + (time zone number)
//                 + (Daylight Savings Time correction; -1 or 0)
//               where (local hour) range is 0 to 24,
//               (time zone number) range is -12 to +12, and
//               (Daylight Time correction) is -1 if on Daylight Time
//               (summer half of year), 0 otherwise;
//               Example: 8:30 am Eastern Daylight Time would be
//
//                           HOUR = 8.5 + 5 - 1 = 12.5

//      LAT      latitude [degrees]
//               (REAL; range -90.0 to 90.0; north is positive)

//      LONG     longitude [degrees]
//               (REAL; range -180.0 to 180.0; east is positive)

//   Output:

//      AZ       solar azimuth angle (measured east from north,
//               0 to 360 degs)

//      EL       solar elevation angle [-90 to 90 degs];
//               solar zenith angle = 90 - EL

//      SOLDIA   solar diameter [degs]

//      SOLDST   distance to sun [Astronomical Units, AU]
//               (1 AU = mean Earth-sun distance = 1.49597871E+11 m
//                in IAU 1976 System of Astronomical Constants)

//   Local Variables:

//     DEC       Declination (radians)

//     ecLong    Ecliptic longitude (radians)

//     GMST      Greenwich mean sidereal time (hours)

//     HA        Hour angle (radians, -pi to pi)

//     JD        Modified Julian date (number of days, including
//               fractions thereof, from Julian year J2000.0);
//               actual Julian date is JD + 2451545.0

//     LMST      Local mean sidereal time (radians)

//     meanAnomaly    Mean anomaly (radians, normalized to 0 to 2*pi)

//     meanLon    Mean longitude of Sun, corrected for aberration
//               (deg; normalized to 0-360)

//     obiquityEc    Obliquity of the ecliptic (radians)

//     RA        Right ascension  (radians)

//     REFRAC    Refraction correction for US Standard Atmosphere (degs)

// --------------------------------------------------------------------
//   Uses double precision for safety and because Julian dates can
//   have a large number of digits in their full form (but in practice
//   this version seems to work fine in single precision if you only
//   need about 3 significant digits and aren't doing precise climate
//   change or solar tracking work).
// --------------------------------------------------------------------

//   Why does this routine require time input as Greenwich Mean Time
//   (GMT; also called Universal Time, UT) rather than "local time"?
//   Because "local time" (e.g. Eastern Standard Time) can be off by
//   up to half an hour from the actual local time (called "local mean
//   solar time").  For society's convenience, "local time" is held
//   constant across each of 24 time zones (each technically 15 longitude
//   degrees wide although some are distorted, again for societal
//   convenience).  Local mean solar time varies continuously around a
//   longitude belt;  it is not a step function with 24 steps.
//   Thus it is far simpler to calculate local mean solar time from GMT,
//   by adding 4 min for each degree of longitude the location is
//   east of the Greenwich meridian or subtracting 4 min for each degree
//   west of it.

// --------------------------------------------------------------------

//   time
//
//   The measurement of time has become a complicated topic.  A few
//   basic facts are:
//
//   (1) The Gregorian calendar was introduced in 1582 to replace
//   Julian calendar; in it, every year divisible by four is a leap
//   year just as in the Julian calendar except for centurial years
//   which must be exactly divisible by 400 to be leap years.  Thus
//   2000 is a leap year, but not 1900 or 2100.

//   (2) The Julian day begins at Greenwich noon whereas the calendar
//   day begins at the preceding midnight;  and Julian years begin on
//   "Jan 0" which is really Greenwich noon on Dec 31.  True Julian
//   dates are a continous count of day numbers beginning with JD 0 on
//   1 Jan 4713 B.C.  The term "Julian date" is widely misused and few
//   people understand it; it is best avoided unless you want to study
//   the Astronomical Almanac and learn to use it correctly.

//   (3) Universal Time (UT), the basis of civil timekeeping, is
//   defined by a formula relating UT to GMST (Greenwich mean sidereal
//   time).  UTC (Coordinated Universal Time) is the time scale
//   distributed by most broadcast time services.  UT, UTC, and other
//   related time measures are within a few sec of each other and are
//   frequently used interchangeably.

//   (4) Beginning in 1984, the "standard epoch" of the astronomical
//   coordinate system is Jan 1, 2000, 12 hr TDB (Julian date
//   2,451,545.0, denoted J2000.0).  The fact that this routine uses
//   1949 as a point of reference is merely for numerical convenience.

/**
 * @prop solarElevation Solar elevation angle [-90 to 90 degs]; solar zenith angle = 90 - EL.
 * @prop solarAzimuth Solar azimuth angle (measured east from north, [0 to 360 degs]).
 * @prop solarDistance Distance to sun [Astronomical Units, AU];
 * (1 AU = mean Earth-sun distance = 1.49597871E+11 m in IAU 1976 System of Astronomical Constants).
 * @prop solarDiameter Solar diameter [degs].
 */
type SolarParameters = {
  solarElevation: number;
  solarAzimuth: number;
  solarDistance: number;
  solarDiameter: number;
};
/**
 * Calculates the solar azimuth and elevation.
 * @param utcTime JS Date object with a UTC datetime.
 * @param lat latitude in range [-90, 90].
 * @param lon longitude in range [-180, 180].
 * @param out Optional object to write the results. A new object will be returned if undefined.
 * @returns the solar parameters on the given time and location.
 */
export function calculateSunAzimuthElevation(
  utcTime: Date,
  lat: number,
  lon: number,
  out: SolarParameters | undefined = undefined,
) {
  const year = clamp(utcTime.getUTCFullYear(), 1950, 2050);
  const day = dayOfYear(utcTime);
  const hour = utcTime.getUTCHours() + utcTime.getUTCMinutes() / 60;
  lat = clamp(lat, -90, 90);
  lon = clamp(lon, -180, 180);

  const rpd = Math.PI / 180;

  // current Julian date (actually add 2,400,000 for true JD);  LEAP = leap days since 1949;
  // 32916.5 is midnite 0 jan 1949 minus 2.4e6
  const delta = year - 1949;
  const leap = delta / 4;
  let jd = 32916.5 + (delta * 365 + leap + day) + hour / 24;

  // last yr of century not leap yr unless divisible
  // by 400 (not executed for the allowed YEAR range,
  // but left in so our successors can adapt this for
  // the following 100 years)
  if (year % 100 === 0 && year % 400 !== 0) {
    jd -= 1;
  }

  // ecliptic coordinates
  // 51545.0 + 2.4e6 = noon 1 jan 2000
  const time = jd - 51545.0;

  // force mean longitude between 0 and 360 degs
  let meanLon = (280.46 + 0.9856474 * time) % 360;
  if (meanLon < 0) {
    meanLon += 360;
  }

  // mean anomaly in radians between 0 and 2*pi
  let meanAnomaly = (357.528 + 0.9856003 * time) % 360;
  if (meanAnomaly < 0) {
    meanAnomaly += 360;
  }

  meanAnomaly *= rpd;

  // ecliptic longitude and obliquity
  // of ecliptic in radians
  let ecLong = (meanLon + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) % 360;
  if (ecLong < 0) {
    ecLong += 360;
  }
  ecLong *= rpd;

  const obiquityEc = (23.439 - 0.0000004 * time) * rpd;

  // right ascension
  const NUM = Math.cos(obiquityEc) * Math.sin(ecLong);
  const DEN = Math.cos(ecLong);
  let RA = Math.atan(NUM / DEN);

  // Force right ascension between 0 and 2*pi
  if (DEN < 0.0) {
    RA += Math.PI;
  } else if (NUM < 0) {
    RA += Math.PI * 2;
  }

  // declination
  const DEC = Math.asin(Math.sin(obiquityEc) * Math.sin(ecLong));

  // Greenwich mean sidereal time in hours
  let GMST = (6.697375 + 0.0657098242 * time + hour) % 24;

  // Hour not changed to sidereal time since
  // 'time' includes the fractional day
  if (GMST < 0) {
    GMST += 24;
  }

  // local mean sidereal time in radians
  let LMST = (GMST + lon / 15) % 24;
  if (LMST < 0) {
    LMST += 24;
  }
  LMST = LMST * 15 * rpd;

  // hour angle in radians between -pi and pi
  let HA = LMST - RA;

  if (HA < -Math.PI) {
    HA += Math.PI * 2;
  }
  if (HA > Math.PI) {
    HA -= Math.PI * 2;
  }

  // solar azimuth and elevation
  let solarElevation = Math.asin(
    Math.sin(DEC) * Math.sin(lat * rpd) + Math.cos(DEC) * Math.cos(lat * rpd) * Math.cos(HA),
  );

  let solarAzimuth = Math.asin((-Math.cos(DEC) * Math.sin(HA)) / Math.cos(solarElevation));

  // Put azimuth between 0 and 2*pi radians
  if (Math.sin(DEC) - Math.sin(solarElevation) * Math.sin(lat * rpd) >= 0) {
    if (Math.sin(solarAzimuth) < 0) {
      solarAzimuth += Math.PI * 2;
    }
  } else {
    solarAzimuth = Math.PI - solarAzimuth;
  }

  // Convert elevation and azimuth to degrees
  solarElevation /= rpd;
  solarAzimuth /= rpd;

  //  ======== Refraction correction for U.S. Standard Atmos. ==========
  //      (assumes elevation in degs) (3.51823=1013.25 mb/288 K)
  let REFRAC = 0;
  if (solarElevation >= 19.225) {
    REFRAC = (0.00452 * 3.51823) / Math.tan(solarElevation * rpd);
  } else if (solarElevation > -0.766 && solarElevation < 19.225) {
    REFRAC =
      (3.51823 * (0.1594 + solarElevation * (0.0196 + 0.00002 * solarElevation))) /
      (1.0 + solarElevation * (0.505 + 0.0845 * solarElevation));
  }

  solarElevation += REFRAC;
  // ===================================================================
  // distance to sun in A.U. & diameter in degs
  const solarDistance = 1.00014 - 0.01671 * Math.cos(meanAnomaly) - 0.00014 * Math.cos(2 * meanAnomaly);
  const solarDiameter = 0.5332 / solarDistance;

  solarElevation = clamp(solarElevation, -90, 90);
  solarAzimuth = clamp(solarAzimuth, 0, 360);

  if (out === undefined) {
    out = {} as SolarParameters;
  }

  out.solarElevation = solarElevation;
  out.solarAzimuth = solarAzimuth;
  out.solarDistance = solarDistance;
  out.solarDiameter = solarDiameter;

  return out;
}

/**
 *
 * @param solarParams Solar parameters from {@link calculateSunAzimuthElevation}.
 */
export function calculateAmbientBrightness(solarParams: SolarParameters) {
  return lerp(solarParams.solarElevation, -6, 12, 0, 1);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(value: number, minX: number, maxX: number, minY: number, maxY: number) {
  return clamp((value - minX) / (maxX - minX), 0, 1) * (maxY - minY) + minY;
}

function dayOfYear(utcDate: Date) {
  const datum = new Date(utcDate.getFullYear(), 0, 0);
  const secondsIntoYear = utcDate.valueOf() - datum.valueOf();
  const secondsPerDay = 1000 * 60 * 60 * 24;
  return clamp(1 + Math.trunc(secondsIntoYear / secondsPerDay), 1, 366);
}
