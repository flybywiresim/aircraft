//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Arinc429Word } from '@shared/arinc429';
import { DigitalInputs } from '../DigitalInputs';

export class Sensors {
    public NoseGearDown: boolean = false;

    public ParkingBrakeSet: boolean = false;

    public Latitude: Arinc429Word = Arinc429Word.empty();

    public Longitude: Arinc429Word = Arinc429Word.empty();

    public Altitude: Arinc429Word = Arinc429Word.empty();

    public GroundSpeed: Arinc429Word = Arinc429Word.empty();

    constructor(digitalInputs: DigitalInputs) {
        digitalInputs.addDataCallback('noseGearCompressed', (compressed: boolean) => {
            this.NoseGearDown = compressed;
        });
        digitalInputs.addDataCallback('parkingBrakeSet', (set: boolean) => {
            this.ParkingBrakeSet = set;
        });
        digitalInputs.addDataCallback('currentLatitude', (lat: Arinc429Word) => {
            this.Latitude = lat;
        });
        digitalInputs.addDataCallback('currentLongitude', (long: Arinc429Word) => {
            this.Longitude = long;
        });
        digitalInputs.addDataCallback('currentAltitude', (altitude: Arinc429Word) => {
            this.Altitude = altitude;
        });
        digitalInputs.addDataCallback('groundSpeed', (speed: Arinc429Word) => {
            this.GroundSpeed = speed;
        });
    }

    public powerDown(): void {
        this.NoseGearDown = false;
        this.ParkingBrakeSet = false;
        this.Latitude = Arinc429Word.empty();
        this.Longitude = Arinc429Word.empty();
        this.Altitude = Arinc429Word.empty();
        this.GroundSpeed = Arinc429Word.empty();
    }
}
