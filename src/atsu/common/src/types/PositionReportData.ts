export interface FlightStateData {
    lat: number,
    lon: number,
    altitude: number,
    heading: number,
    track: number,
    indicatedAirspeed: number,
    groundSpeed: number,
    verticalSpeed: number,
}

export interface AutopilotData {
    apActive: boolean,
    speed: number,
    machMode: boolean,
    altitude: number,
}

export interface EnvironmentData {
    windDirection: number,
    windSpeed: number,
    temperature: number,
}
