
/**
 * A class for conversions of degree units.
 */
class Degrees {
  /**
   * Converts degrees to radians.
   * @param degrees The degrees to convert.
   * @returns The result as radians.
   */
  public toRadians = (degrees: number): number => degrees * (Math.PI / 180);
}

/**
 * A class for conversions of foot units.
 */
class Feet {
  /**
   * Converts feet to meters.
   * @param feet The feet to convert.
   * @returns The result as meters.
   */
  public toMeters = (feet: number): number => feet * 0.3048;

  /**
   * Converts feet to nautical miles.
   * @param feet The feet to convert.
   * @returns The result as nautical miles.
   */
  public toNauticalMiles = (feet: number): number => feet / 6076.11549;
}

/**
 * A class for conversions of meter units.
 */
class Meters {
  /**
   * Converts meters to feet.
   * @param meters The meters to convert.
   * @returns The result as feet.
   */
  public toFeet = (meters: number): number => meters / 0.3048;

  /**
   * Converts meters to nautical miles.
   * @param meters The meters to convert.
   * @returns The result as nautical miles.
   */
  public toNauticalMiles = (meters: number): number => meters / 1852;
}

/**
 * A class for conversions of nautical mile units.
 */
class NauticalMiles {
  /**
   * Converts nautical miles to feet.
   * @param nm The nautical miles to convert.
   * @returns The result as feet.
   */
  public toFeet = (nm: number): number => nm * 6076.11549;

  /**
   * Converts nautical miles to meters.
   * @param nm The nautical miles to convert.
   * @returns The result as meters.
   */
  public toMeters = (nm: number): number => nm * 1852;
}

/**
 * A class for conversions of radian units.
 */
class Radians {
  /**
   * Converts radians to degrees.
   * @param radians The radians to convert.
   * @returns The result as degrees.
   */
  public toDegrees = (radians: number): number => radians * 180 / Math.PI;
}

/**
 * A class for unit conversions.
 */
export class Units {
  /** The degrees unit. */
  public static Degrees = new Degrees();

  /** The radians unit. */
  public static Radians = new Radians();

  /** The feet unit. */
  public static Feet = new Feet();

  /** The meters unit. */
  public static Meters = new Meters();

  /** The nautical miles unit. */
  public static NauticalMiles = new NauticalMiles();
}
