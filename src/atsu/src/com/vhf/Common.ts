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

// maximum search range in NM
export const MaxSearchRange = 400;
// maximum datarate under optimal conditions: 31.5 kb/s
export const VdlMaxDatarate = 31500;
