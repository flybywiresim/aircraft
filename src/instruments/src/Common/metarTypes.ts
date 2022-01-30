/* eslint-disable camelcase */
// Disable eslint camelcase as these are types for external library

export enum ColorCode {
    None,
    Highlight,
    Caution,
    Warning,
    TrendMarker,
    Info
}

export type MetarParserType = {
    raw_text: string,
    raw_parts: string[],
    color_codes: ColorCode[], // contains codes for coloring parts - order must be identical to raw_parts
    icao: string,
    observed: Date,
    wind: Wind,
    visibility: Visibility,
    conditions: [ConditionCode],
    clouds: [Cloud],
    ceiling: Ceiling,
    temperature: Temperature,
    dewpoint: Dewpoint,
    humidity_percent: number,
    barometer: Barometer,
    flight_category: string,
}

export type Wind = {
    degrees: number,
    degrees_from: number,
    degrees_to: number,
    speed_kts: number,
    speed_mps: number,
    gust_kts: number,
    gust_mps: number,
};

export type Visibility = {
    miles: string,
    miles_float: number,
    meters: string,
    meters_float: number,
};

export type ConditionCode = {
    code: string,
};

export type Cloud = {
    code: string,
    base_feet_agl: number,
    base_meters_agl: number,
};

export type Ceiling = {
    code: string,
    feet_agl: number,
    meters_agl: number,
};

export type Temperature = {
    celsius: number,
    fahrenheit: number,
};

export type Dewpoint = {
    celsius: number,
    fahrenheit: number,
};

export type Barometer = {
    hg: number,
    kpa: number,
    mb: number,
};
