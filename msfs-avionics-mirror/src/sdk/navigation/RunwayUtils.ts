import { GeoPoint } from '../utils/geo/GeoPoint';
import { NavMath } from '../utils/geo/NavMath';
import { UnitType } from '../utils/math/NumberUnit';
import { AirportFacility, AirportRunway, ApproachProcedure, FacilityFrequency, OneWayRunway, RunwayFacility } from './Facilities';

/**
 * Methods for working with Runways and Runway Designations.
 */
export class RunwayUtils {
  private static readonly RUNWAY_DESIGNATOR_LETTERS = {
    [RunwayDesignator.RUNWAY_DESIGNATOR_NONE]: '',
    [RunwayDesignator.RUNWAY_DESIGNATOR_LEFT]: 'L',
    [RunwayDesignator.RUNWAY_DESIGNATOR_RIGHT]: 'R',
    [RunwayDesignator.RUNWAY_DESIGNATOR_CENTER]: 'C',
    [RunwayDesignator.RUNWAY_DESIGNATOR_WATER]: 'W',
    [RunwayDesignator.RUNWAY_DESIGNATOR_A]: 'A',
    [RunwayDesignator.RUNWAY_DESIGNATOR_B]: 'B',
  }

  protected static tempGeoPoint = new GeoPoint(0, 0);

  /**
   * Gets the letter for a runway designator.
   * @param designator A runway designator.
   * @param lowerCase Whether the letter should be lower case. False by default.
   * @returns The letter for the specified runway designator.
   */
  public static getDesignatorLetter(designator: RunwayDesignator, lowerCase = false): string {
    const letter = RunwayUtils.RUNWAY_DESIGNATOR_LETTERS[designator];
    return lowerCase
      ? letter.toLowerCase()
      : letter;
  }

  /**
   * Creates an empty one-way runway.
   * @returns an empty one-way runway.
   */
  public static createEmptyOneWayRunway(): OneWayRunway {
    return {
      parentRunwayIndex: -1,
      designation: '',
      direction: 36,
      runwayDesignator: RunwayDesignator.RUNWAY_DESIGNATOR_NONE,
      course: 0,
      elevation: 0,
      latitude: 0,
      longitude: 0
    };
  }

  /**
   * Utility method to return two one-way runways from a single runway facility
   * @param runway is the AirportRunway object to evaluate
   * @param index is the index of the AirportRunway in the Facility
   * @returns splitRunways array of OneWayRunway objects
   */
  public static getOneWayRunways(runway: AirportRunway, index: number): OneWayRunway[] {
    const splitRunways: OneWayRunway[] = [];
    const designations: string[] = runway.designation.split('-');
    for (let i = 0; i < designations.length; i++) {
      const runwayNumber = parseInt(designations[i]);

      let designator = RunwayDesignator.RUNWAY_DESIGNATOR_NONE;
      let course = 0;
      let thresholdDistanceFromCenter = 0;
      let thresholdElevation = 0;
      let ilsFrequency;
      if (i === 0) {
        designator = runway.designatorCharPrimary;
        course = runway.direction;
        thresholdDistanceFromCenter = (runway.length / 2) - runway.primaryThresholdLength;
        thresholdElevation = runway.primaryElevation;
        ilsFrequency = runway.primaryILSFrequency.freqMHz === 0 ? undefined : runway.primaryILSFrequency;
      } else if (i === 1) {
        designator = runway.designatorCharSecondary;
        course = NavMath.normalizeHeading(runway.direction + 180);
        thresholdDistanceFromCenter = (runway.length / 2) - runway.secondaryThresholdLength;
        thresholdElevation = runway.secondaryElevation;
        ilsFrequency = runway.secondaryILSFrequency.freqMHz === 0 ? undefined : runway.secondaryILSFrequency;
      }
      const designation = RunwayUtils.getRunwayNameString(runwayNumber, designator);

      const coordinates = RunwayUtils.tempGeoPoint
        .set(runway.latitude, runway.longitude)
        .offset(course - 180, UnitType.METER.convertTo(thresholdDistanceFromCenter, UnitType.GA_RADIAN));

      splitRunways.push({
        parentRunwayIndex: index,
        designation,
        direction: runwayNumber,
        runwayDesignator: designator,
        course,
        elevation: thresholdElevation,
        latitude: coordinates.lat,
        longitude: coordinates.lon,
        ilsFrequency
      });
    }
    return splitRunways;
  }

  /**
   * Utility method to return the runway name from the number and designator (L/R/C/W)
   * @param runwayNumber is the integer part of a runway name (18, 26, 27, etc)
   * @param designator is the RunwayDesignator enum for the runway
   * @param padded Whether single-char runways should be 0-padded.
   * @param prefix A prefix to put before the runway name.
   * @returns the runway name string
   */
  public static getRunwayNameString(runwayNumber: number, designator: RunwayDesignator, padded = true, prefix = ''): string {
    let numberText = `${runwayNumber}`;
    if (padded) {
      numberText = numberText.padStart(2, '0');
    }

    return prefix + numberText + RunwayUtils.getDesignatorLetter(designator);
  }

  /**
   * Gets a one-way runway from an airport that matches a runway designation by number and designator.
   * @param airport The airport facility in which to search for the match.
   * @param runwayNumber A runway number to match.
   * @param runwayDesignator A runway designator to match.
   * @returns The one-way runway which matches the designation, or undefined if no match could be found.
   */
  public static matchOneWayRunway(airport: AirportFacility, runwayNumber: number, runwayDesignator: RunwayDesignator): OneWayRunway | undefined {
    const length = airport.runways.length;
    for (let r = 0; r < length; r++) {
      const runway = airport.runways[r];
      const designation = runway.designation;
      const primaryRunwayNumber = parseInt(designation.split('-')[0]);
      const secondaryRunwayNumber = parseInt(designation.split('-')[1]);
      if (primaryRunwayNumber === runwayNumber && runway.designatorCharPrimary === runwayDesignator) {
        const oneWayRunways = RunwayUtils.getOneWayRunways(runway, r);
        return oneWayRunways[0];
      } else if (secondaryRunwayNumber === runwayNumber && runway.designatorCharSecondary === runwayDesignator) {
        const oneWayRunways = RunwayUtils.getOneWayRunways(runway, r);
        return oneWayRunways[1];
      }
    }
    return undefined;
  }

  /**
   * Gets a one-way runway from an airport that matches a runway designation string.
   * @param airport The airport facility in which to search for the match.
   * @param designation A runway designation.
   * @returns The one-way runway which matches the designation, or undefined if no match could be found.
   */
  public static matchOneWayRunwayFromDesignation(airport: AirportFacility, designation: string): OneWayRunway | undefined {
    const length = airport.runways.length;
    for (let i = 0; i < length; i++) {
      const match = RunwayUtils.getOneWayRunways(airport.runways[i], i).find((r) => {
        return (r.designation === designation);
      });
      if (match) {
        return match;
      }
    }
    return undefined;
  }

  /**
   * Gets a one-way runway from an airport that matches a runway ident.
   * @param airport The airport facility in which to search for the match.
   * @param ident A runway ident.
   * @returns The one-way runway which matches the ident, or undefined if no match could be found.
   */
  public static matchOneWayRunwayFromIdent(airport: AirportFacility, ident: string): OneWayRunway | undefined {
    return RunwayUtils.matchOneWayRunwayFromDesignation(airport, ident.substr(2).trim());
  }

  /**
   * Utility method to return the procedures for a given runway.
   * @param procedures The procedures for the airport.
   * @param runway The given runway to find procedures for.
   * @returns A list of approach procedures for the given runway.
   */
  public static getProceduresForRunway(procedures: readonly ApproachProcedure[], runway: AirportRunway): Array<ApproachProcedure> {
    const oneways = new Array<string>();

    // TODO Make the designation splitting logic a common routine too.
    const designations: string[] = runway.designation.split('-');
    for (let i = 0; i < designations.length; i++) {
      const runwayNumber = parseInt(designations[i]);
      let runwayName: string;
      if (i === 0) {
        runwayName = RunwayUtils.getRunwayNameString(runwayNumber, runway.designatorCharPrimary, false, '');
      } else {
        runwayName = RunwayUtils.getRunwayNameString(runwayNumber, runway.designatorCharSecondary, false, '');
      }
      oneways.push(runwayName);
    }

    const found = new Array<ApproachProcedure>();
    for (const procedure of procedures) {
      if (oneways.includes(procedure.runway.trim())) {
        found.push(procedure);
      } else if (procedure.runwayNumber === 0) {
        found.push(procedure);
      }
    }
    return found;
  }

  /**
   * Gets the localizer frequency for a runway.
   * @param airport The airport to which the query runway belongs.
   * @param runway The query runway.
   * @returns The localizer frequency for the query runway, or undefined if one could not be found.
   */
  public static getLocFrequency(airport: AirportFacility, runway: OneWayRunway): FacilityFrequency | undefined;
  /**
   * Gets the localizer frequency for a runway.
   * @param airport The airport to which the query runway belongs.
   * @param runwayDesignation The designation of the query runway.
   * @returns The localizer frequency for the query runway, or undefined if one could not be found.
   */
  public static getLocFrequency(airport: AirportFacility, runwayDesignation: string): FacilityFrequency | undefined;
  /**
   * Gets the localizer frequency for a runway.
   * @param airport The airport to which the query runway belongs.
   * @param runwayNumber The number of the query runway.
   * @param runwayDesignator The designator of the query runway.
   * @returns The localizer frequency for the query runway, or undefined if one could not be found.
   */
  public static getLocFrequency(airport: AirportFacility, runwayNumber: number, runwayDesignator: RunwayDesignator): FacilityFrequency | undefined;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public static getLocFrequency(airport: AirportFacility, arg1: OneWayRunway | string | number, arg2?: RunwayDesignator): FacilityFrequency | undefined {
    let runway;
    if (typeof arg1 === 'string') {
      const matchedRunway = RunwayUtils.matchOneWayRunwayFromDesignation(airport, arg1);
      if (!matchedRunway) {
        return undefined;
      }
      runway = matchedRunway;
    } else if (typeof arg1 === 'number') {
      const matchedRunway = RunwayUtils.matchOneWayRunway(airport, arg1, arg2 as RunwayDesignator);
      if (!matchedRunway) {
        return undefined;
      }
      runway = matchedRunway;
    } else {
      runway = arg1;
    }

    const runwayDesignation = runway.designation;

    if (runway.ilsFrequency) {
      return runway.ilsFrequency;
    }

    for (let i = 0; i < airport.frequencies.length; i++) {
      // Note: drop the leading zero in the runway designation for the search because some third-party sceneries
      // format the frequency names without the leading zero.
      const match = airport.frequencies[i].name.search(runwayDesignation.replace(/^0/, ''));
      if (match > -1) {
        return airport.frequencies[i];
      }
    }
    return undefined;
  }

  /**
   * A comparer for sorting runways by number, and then by L, C, and R.
   * @param r1 The first runway to compare.
   * @param r2 The second runway to compare.
   * @returns -1 if the first is before, 0 if equal, 1 if the first is after.
   */
  public static sortRunways(r1: OneWayRunway, r2: OneWayRunway): number {
    if (r1.direction === r2.direction) {
      let v1 = 0;
      if (r1.designation.indexOf('L') != -1) {
        v1 = 1;
      } else if (r1.designation.indexOf('C') != -1) {
        v1 = 2;
      } else if (r1.designation.indexOf('R') != -1) {
        v1 = 3;
      }
      let v2 = 0;
      if (r2.designation.indexOf('L') != -1) {
        v2 = 1;
      } else if (r2.designation.indexOf('C') != -1) {
        v2 = 2;
      } else if (r2.designation.indexOf('R') != -1) {
        v2 = 3;
      }
      return v1 - v2;
    }
    return r1.direction - r2.direction;
  }

  /**
   * Gets the ICAO string for the runway facility associated with a one-way runway.
   * @param airport The runway's parent airport.
   * @param runway A one-way runway.
   * @returns the ICAO string for the runway facility associated with the one-way runway.
   */
  public static getRunwayFacilityIcao(airport: AirportFacility, runway: OneWayRunway): string {
    return `R  ${airport.icao.substr(7, 4)}RW${runway.designation.padEnd(3, ' ')}`;
  }

  /**
   * Creates a runway waypoint facility from a runway.
   * @param airport The runway's parent airport.
   * @param runway A one-way runway.
   * @returns A runway waypoint facility corresponding to the runway.
   */
  public static createRunwayFacility(airport: AirportFacility, runway: OneWayRunway): RunwayFacility {
    return {
      icao: RunwayUtils.getRunwayFacilityIcao(airport, runway),
      name: `Runway ${runway.designation}`,
      region: airport.region,
      city: airport.city,
      lat: runway.latitude,
      lon: runway.longitude,
      magvar: airport.magvar,
      runway
    };
  }

  /**
   * Gets an alpha code from a runway number.
   * @param number is the runway number.
   * @returns a letter.
   */
  public static getRunwayCode(number: number): string {
    const n = Math.round(number);
    return String.fromCharCode(48 + n + (n > 9 ? 7 : 0));
  }
}
