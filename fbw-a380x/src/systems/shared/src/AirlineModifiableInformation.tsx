export const AirlineModifiableInformation: AmiCollection = {
  EK: {
    thrRedAlt: 1500, // ft AGL
    accAlt: 1500, // ft AGL
    eoAccAlt: 1500, // ft AGL
    perfFactor: 0, // %
    idleFactor: 0, // %
    perfCode: 'ARM',
    taxiFuel: 200, // kg
    rteRsv: 5, // %
    rsvMin: 0, // kg
    rsvMax: 10_000, // kg
    rsvInflt: true, // YES / NO
    rsvAltn: false, // YES / NO
    finalTg: 30, // minutes
    finalTf: 30, // minutes
    finalFixf: 0, // kg
    finalAlt: 1500, // ft AGL
    finalDest: 'A', // P or A
  },
};

interface AmiCollection {
  [key: string]: Ami;
}

interface Ami {
  /**
   * ft AGL, thrust reduction altitude
   */
  thrRedAlt: Feet;
  /**
   * ft AGL, acceleration altitude
   */
  accAlt: Feet;
  /**
   * ft AGL, engine out acceleration altitude
   */
  eoAccAlt: Feet;
  /**
   * %, performance factor
   */
  perfFactor: Percent;
  /**
   * %, idle factor
   */
  idleFactor: Percent;
  /**
   * modification password, three characters
   */
  perfCode: string;
  /**
   * kg, taxi fuel
   */
  taxiFuel: Kilograms;
  /**
   * % of trip fuel as route reserves
   */
  rteRsv: Percent;
  /**
   * kg, Minimum value of route reserves
   */
  rsvMin: Kilograms;
  /**
   * kg, Maximum value of route reserves
   */
  rsvMax: Kilograms; //
  /**
   * Reserves are computed for fuel predictions in flight
   */
  rsvInflt: boolean;
  /**
   * Reserves includes fuel for alternate trip
   */
  rsvAltn: boolean;
  /**
   * minutes, Final holding time used for fuel planning computation
   */
  finalTg: Minutes;
  /**
   * minutes, Final holding time used for fuel prediction computation (only used if finalFixf = 0)
   */
  finalTf: Minutes;
  /**
   * kg, Final holding fuel quantity used for fuel prediction computation
   */
  finalFixf: Kilograms;
  /**
   * ft AGL, Altitude of the holding pattern on which the final fuel computation is based
   */
  finalAlt: Feet;
  /**
   * P or A, Final holding pattern is flown at Primary or Alternate destination
   */
  finalDest: 'A' | 'P';
}
