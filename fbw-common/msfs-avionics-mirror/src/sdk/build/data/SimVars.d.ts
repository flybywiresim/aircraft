/**
 * Valid type arguments for Set/GetSimVarValue
 */
export declare enum SimVarValueType {
    Number = "number",
    Degree = "degrees",
    Knots = "knots",
    Feet = "feet",
    Meters = "meters",
    FPM = "feet per minute",
    Radians = "radians",
    InHG = "inches of mercury",
    MB = "Millibars",
    Bool = "Bool",
    Celsius = "celsius",
    MHz = "MHz",
    KHz = "KHz",
    NM = "nautical mile",
    String = "string",
    RPM = "Rpm",
    PPH = "Pounds per hour",
    GPH = "gph",
    Farenheit = "farenheit",
    PSI = "psi",
    GAL = "gallons",
    Hours = "Hours",
    Volts = "Volts",
    Amps = "Amperes",
    Seconds = "seconds",
    Enum = "Enum",
    LLA = "latlonalt",
    MetersPerSecond = "meters per second",
    GForce = "G Force"
}
/**
 * The definition of a simvar and associated value type.
 */
export declare type SimVarDefinition = {
    /** The name of the simvar. */
    name: string | (() => string);
    /** The value to be used to retrieve this simvar. */
    type: SimVarValueType;
};
/**
 * Stub type for simvars to extend
 */
export interface SimVarEventTypes {
}
//# sourceMappingURL=SimVars.d.ts.map