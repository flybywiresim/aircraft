export const AirlineModifiableInformation: AmiCollection = {
    'EK': {
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
        finalDest: 'A' // P or A
    }
};

type AmiCollection = {
   [key: string]: AMI;
};

type AMI = {
    thrRedAlt: Feet, // ft AGL, thrust reduction altitude
    accAlt: Feet, // ft AGL, acceleration altitude
    eoAccAlt: Feet, // ft AGL, engine out acceleration altitude
    perfFactor: Percent, // %, performance factor
    idleFactor: Percent, // %, idle factor
    perfCode: string, // modification password, three characters
    taxiFuel: Kilograms, // Taxi fuel
    rteRsv: Percent, // Percentage of trip fuel as route reserves
    rsvMin: Kilograms, // Minimum value of route reserves
    rsvMax: Kilograms, // Maximum value of route reserves
    rsvInflt: boolean, // Reserves are computed for fuel predictions in flight
    rsvAltn: boolean, // Reserves includes fuel for alternate trip
    finalTg: Minutes, // Final holding time used for fuel planning computation
    finalTf: Minutes, // Final holding time used for fuel prediction computation (only used if finalFixf = 0)
    finalFixf: Kilograms, // Final holding fuel quantity used for fuel prediction computation
    finalAlt: Feet, // ft AGL, Altitude of the holding pattern on which the final fuel computation is based
    finalDest: 'A' | 'P' // P or A, Final holding pattern is flown at Primary or Alternate destination
};
