//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

export class Aircraft {
    public Latitude = 0.0;

    public Longitude = 0.0;

    public Altitude = 0.0;
}

export class OwnAircraft extends Aircraft {
    public AltitudeAboveGround = 0.0;

    public PressureAltitude = 0.0;
}

// use a simple line of sight algorithm to calculate the maximum distance
// it ignores the topolography, but simulates the earth curvature
// reference: https://audio.vatsim.net/storage/AFV%20User%20Guide.pdf
export const maximumDistanceLoS = (altitude0: number, altitude1: number): number => 1.23 * Math.sqrt(Math.abs(altitude0 - altitude1));
