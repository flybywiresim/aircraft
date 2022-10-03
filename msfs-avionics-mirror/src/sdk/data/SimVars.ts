/**
 * Valid type arguments for Set/GetSimVarValue
 */
export enum SimVarValueType {
    Number = 'number',
    Percent = 'percent',
    Degree = 'degrees',
    Knots = 'knots',
    Feet = 'feet',
    Meters = 'meters',
    FPM = 'feet per minute',
    Radians = 'radians',
    InHG = 'inches of mercury',
    MB = 'Millibars',
    Bool = 'Bool',
    Celsius = 'celsius',
    MHz = 'MHz',
    KHz = 'KHz',
    NM = 'nautical mile',
    String = 'string',
    RPM = 'Rpm',
    PPH = 'Pounds per hour',
    GPH = 'gph',
    Farenheit = 'farenheit',
    PSI = 'psi',
    GAL = 'gallons',
    LBS = 'pounds',
    Hours = 'Hours',
    Volts = 'Volts',
    Amps = 'Amperes',
    Seconds = 'seconds',
    Enum = 'Enum',
    LLA = 'latlonalt',
    MetersPerSecond = 'meters per second',
    Mach = 'mach',
    Pounds = 'pounds',
    SlugsPerCubicFoot = 'slug per cubic foot'
}

/**
 * The definition of a simvar and associated value type.
 */
export type SimVarDefinition = {

    /** The name of the simvar. */
    name: string,

    /** The value to be used to retrieve this simvar. */
    type: SimVarValueType,
}
