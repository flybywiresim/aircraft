enum DmsDirection {
  NORTH = 'N',
  SOUTH = 'S',
  WEST = 'W',
  EAST = 'E'
}

/** Holds the parts  */
type DmsValues = {
  /** The direction N/S/E/W */
  direction: DmsDirection
  /** The degrees component */
  degrees: number,
  /** The minutes component */
  minutes: number,
  /** The seconds component */
  seconds: number
}

/**
 * A class to format latitude/longitude to DMS.
 * @class DmsFormatter
 */
export class DmsFormatter {

  private readonly coordsParts: DmsValues = {
    direction: DmsDirection.NORTH,
    degrees: 0,
    minutes: 0,
    seconds: 0
  }

  /**
   * Builds a DMS string out of the given latitude.
   * @param value The latitude.
   * @returns The DMS string.
   */
  public getLatDmsStr(value: number): string {
    const parts = this.parseLat(value);
    if (parts.minutes >= 59.5) {
      parts.minutes = 0;
      parts.degrees++;
    }
    return `${parts.direction} ${parts.degrees.toString().padStart(2, '0')}°${parts.minutes.toFixed(2).padStart(5, '0')}'`;
  }

  /**
   * Builds a DMS string out of the given longitude.
   * @param value The longitude.
   * @returns The DMS string.
   */
  public getLonDmsStr(value: number): string {
    const parts = this.parseLon(value);
    if (parts.minutes >= 59.5) {
      parts.minutes = 0;
      parts.degrees++;
    }
    return `${parts.direction}${parts.degrees.toString().padStart(3, '0')}°${parts.minutes.toFixed(2).padStart(5, '0')}'`;
  }

  /**
   * Parses a latitude in to the dms parts.
   * @param value The latitude in degrees.
   * @returns The DMS parts.
   */
  public parseLat(value: number): DmsValues {
    this.coordsParts.direction = value < 0 ? DmsDirection.SOUTH : DmsDirection.NORTH;
    return this.parse(value);
  }

  /**
   * Parses a longitude in to the dms parts.
   * @param value The longitude in degrees.
   * @returns The DMS parts.
   */
  public parseLon(value: number): DmsValues {
    this.coordsParts.direction = value < 0 ? DmsDirection.WEST : DmsDirection.EAST;
    return this.parse(value);
  }

  /**
   * Parses the latitude/longitude.
   * @private
   * @param value The value to parse.
   * @returns The DMS parts.
   */
  private parse(value: number): DmsValues {
    value = Math.abs(value);
    this.coordsParts.degrees = Math.trunc(value);
    value = (value - this.coordsParts.degrees) * 60;
    this.coordsParts.minutes = value;
    this.coordsParts.seconds = (value - this.coordsParts.minutes) * 60;
    return this.coordsParts;
  }
}